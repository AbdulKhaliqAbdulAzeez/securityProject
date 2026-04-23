from __future__ import annotations

import shutil
import subprocess
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
class ValidationResult:
    success: bool
    formatted_code: str
    logs: list[CommandLog]

    def combined_log(self) -> str:
        return "\n\n".join(log.render() for log in self.logs)


VALIDATION_COMMAND_ARGUMENTS: tuple[tuple[str, ...], ...] = (
    ("fmt", "main.tf"),
    ("init", "-backend=false", "-input=false", "-no-color"),
    ("validate", "-no-color"),
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
        return ValidationResult(
            success=success, formatted_code=formatted_code, logs=logs
        )


__all__ = ["CommandLog", "ValidationResult", "validate_terraform"]
