from __future__ import annotations

import json
import shutil
import subprocess
import sysconfig
import tempfile
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path


@dataclass
class CommandLog:
    command: str
    return_code: int
    stdout: str
    stderr: str

    def render(self) -> str:
        def _render_stream(label: str, content: str) -> str:
            if content:
                return f"{label}:\n{content}"

            return f"{label}:"

        sections = [
            f"$ {self.command}",
            f"exit code: {self.return_code}",
            _render_stream("stdout", self.stdout),
            _render_stream("stderr", self.stderr),
        ]

        return "\n\n".join(sections)


@dataclass
class SecurityFinding:
    check_id: str
    check_name: str
    resource: str
    file_path: str
    file_line_range: str
    guideline: str


@dataclass
class SecurityScanResult:
    status: str
    message: str
    findings: list[SecurityFinding]
    log: CommandLog | None = None


@dataclass
class CheckovParseResult:
    is_valid: bool
    findings: list[SecurityFinding]
    error: str = ""


@dataclass
class ValidationResult:
    success: bool
    formatted_code: str
    logs: list[CommandLog]
    security_scan: SecurityScanResult

    def combined_log(self) -> str:
        return "\n\n".join(log.render() for log in self.logs)


VALIDATION_COMMAND_ARGUMENTS: tuple[tuple[str, ...], ...] = (
    ("fmt", "main.tf"),
    ("init", "-backend=false", "-input=false", "-no-color"),
    ("validate", "-no-color"),
)

CHECKOV_COMMAND_ARGUMENTS: tuple[str, ...] = (
    "-d",
    ".",
    "--framework",
    "terraform",
    "--output",
    "json",
)


def _create_not_run_security_scan(message: str) -> SecurityScanResult:
    return SecurityScanResult(
        status="not_run",
        message=message,
        findings=[],
    )


def _format_line_range(line_range: object) -> str:
    if not isinstance(line_range, list) or not line_range:
        return ""

    integer_lines = [line for line in line_range if isinstance(line, int)]
    if not integer_lines:
        return ""

    if len(integer_lines) == 1:
        return str(integer_lines[0])

    return f"{integer_lines[0]}-{integer_lines[-1]}"


def _parse_checkov_output(stdout: str) -> CheckovParseResult:
    if not stdout:
        return CheckovParseResult(
            is_valid=False,
            findings=[],
            error="Checkov did not return JSON output.",
        )

    try:
        payload = json.loads(stdout)
    except json.JSONDecodeError as error:
        return CheckovParseResult(
            is_valid=False,
            findings=[],
            error=f"Checkov returned invalid JSON: {error.msg}.",
        )

    if not isinstance(payload, dict):
        return CheckovParseResult(
            is_valid=False,
            findings=[],
            error="Checkov JSON output was not an object.",
        )

    results = payload.get("results")
    if not isinstance(results, dict):
        return CheckovParseResult(
            is_valid=False,
            findings=[],
            error="Checkov JSON output did not include a results object.",
        )

    failed_checks = results.get("failed_checks")
    if not isinstance(failed_checks, list):
        return CheckovParseResult(
            is_valid=False,
            findings=[],
            error="Checkov JSON output did not include a failed_checks list.",
        )

    findings: list[SecurityFinding] = []
    for failed_check in failed_checks:
        if not isinstance(failed_check, dict):
            continue

        findings.append(
            SecurityFinding(
                check_id=str(failed_check.get("check_id", "Unknown check")),
                check_name=str(
                    failed_check.get("check_name", "Unnamed Checkov finding")
                ),
                resource=str(failed_check.get("resource", "Unknown resource")),
                file_path=str(
                    failed_check.get("repo_file_path")
                    or failed_check.get("file_path")
                    or "main.tf"
                ),
                file_line_range=_format_line_range(failed_check.get("file_line_range")),
                guideline=str(failed_check.get("guideline") or ""),
            )
        )

    return CheckovParseResult(is_valid=True, findings=findings)


def _build_checkov_message(findings: list[SecurityFinding]) -> str:
    finding_count = len(findings)
    noun = "finding" if finding_count == 1 else "findings"
    return (
        f"Checkov reported {finding_count} blocking security {noun}. "
        "Review the findings below before treating this Terraform as ready."
    )


def _resolve_checkov_binary() -> str | None:
    checkov_binary = shutil.which("checkov")
    if checkov_binary:
        return checkov_binary

    scripts_directory = sysconfig.get_path("scripts")
    if not scripts_directory:
        return None

    for candidate in ("checkov", "checkov.exe"):
        resolved_binary = shutil.which(candidate, path=scripts_directory)
        if resolved_binary:
            return resolved_binary

    return None


def _run_checkov_scan(working_directory: Path) -> SecurityScanResult:
    checkov_binary = _resolve_checkov_binary()
    if not checkov_binary:
        return SecurityScanResult(
            status="scanner_unavailable",
            message=(
                "Checkov CLI not found on PATH. Install Checkov locally before "
                "running security scanning."
            ),
            findings=[],
            log=CommandLog(
                command="checkov",
                return_code=127,
                stdout="",
                stderr=(
                    "Checkov CLI not found on PATH. Install Checkov locally before "
                    "running security scanning."
                ),
            ),
        )

    log = _run_command(
        [checkov_binary, *CHECKOV_COMMAND_ARGUMENTS],
        working_directory,
    )
    parse_result = _parse_checkov_output(log.stdout)
    findings = parse_result.findings

    if log.return_code == 0 and parse_result.is_valid and not findings:
        return SecurityScanResult(
            status="passed",
            message="Checkov security scan passed with no blocking findings.",
            findings=[],
            log=log,
        )

    if findings:
        return SecurityScanResult(
            status="failed",
            message=_build_checkov_message(findings),
            findings=findings,
            log=log,
        )

    error_detail = f" {parse_result.error}" if parse_result.error else ""
    return SecurityScanResult(
        status="scan_error",
        message=(
            "Checkov did not complete successfully, so the Terraform remains "
            f"blocked until the scanner issue is resolved.{error_detail}"
        ),
        findings=[],
        log=log,
    )


def _run_command(command: Sequence[str], working_directory: Path) -> CommandLog:
    try:
        completed = subprocess.run(
            command,
            cwd=working_directory,
            capture_output=True,
            text=True,
            check=False,
            timeout=120,
        )
        return CommandLog(
            command=" ".join(command),
            return_code=completed.returncode,
            stdout=completed.stdout.strip(),
            stderr=completed.stderr.strip(),
        )
    except subprocess.TimeoutExpired as error:
        stdout = (error.stdout or "").strip()
        stderr = (error.stderr or "").strip()
        timeout_message = f"Command timed out after {error.timeout} seconds."
        merged_stderr = "\n".join(part for part in [timeout_message, stderr] if part)
        return CommandLog(
            command=" ".join(command),
            return_code=124,
            stdout=stdout,
            stderr=merged_stderr,
        )


def validate_terraform(terraform_code: str) -> ValidationResult:
    if not terraform_code.strip():
        raise ValueError("Terraform code is required for validation.")

    terraform_binary = shutil.which("terraform")
    if not terraform_binary:
        missing_cli_log = CommandLog(
            command="terraform",
            return_code=127,
            stdout="",
            stderr=(
                "Terraform CLI not found on PATH. Install Terraform locally before "
                "running validation."
            ),
        )
        return ValidationResult(
            success=False,
            formatted_code=terraform_code.strip(),
            logs=[missing_cli_log],
            security_scan=_create_not_run_security_scan(
                "Security scanning did not run because Terraform is not installed."
            ),
        )

    with tempfile.TemporaryDirectory(prefix="terraform-validator-") as temp_dir:
        working_directory = Path(temp_dir)
        main_tf_path = working_directory / "main.tf"
        main_tf_path.write_text(terraform_code.strip() + "\n", encoding="utf-8")

        logs: list[CommandLog] = []
        for command_arguments in VALIDATION_COMMAND_ARGUMENTS:
            log = _run_command(
                [terraform_binary, *command_arguments],
                working_directory,
            )
            logs.append(log)

            if log.return_code != 0:
                break

        formatted_code = main_tf_path.read_text(encoding="utf-8").strip()
        success = all(log.return_code == 0 for log in logs)
        if success:
            security_scan = _run_checkov_scan(working_directory)
        else:
            security_scan = _create_not_run_security_scan(
                "Security scanning did not run because Terraform validation failed."
            )

        return ValidationResult(
            success=success,
            formatted_code=formatted_code,
            logs=logs,
            security_scan=security_scan,
        )


__all__ = [
    "CommandLog",
    "CheckovParseResult",
    "SecurityFinding",
    "SecurityScanResult",
    "ValidationResult",
    "validate_terraform",
]
