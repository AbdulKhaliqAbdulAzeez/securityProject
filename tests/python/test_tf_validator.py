from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest

from backend import tf_validator


def fake_which(command: str, path: str | None = None) -> str | None:
    if command == "terraform":
        return "/usr/bin/terraform"

    if command == "checkov" and path is None:
        return "/usr/bin/checkov"

    return None


def test_command_log_render_includes_all_sections() -> None:
    log = tf_validator.CommandLog(
        command="terraform fmt main.tf",
        return_code=0,
        stdout="",
        stderr="",
    )

    assert log.render() == (
        "$ terraform fmt main.tf\n\nexit code: 0\n\nstdout:\n\nstderr:"
    )


def test_validate_terraform_rejects_empty_input() -> None:
    with pytest.raises(ValueError, match="Terraform code is required"):
        tf_validator.validate_terraform("   ")


def test_validate_terraform_reports_missing_cli(monkeypatch) -> None:
    monkeypatch.setattr(tf_validator.shutil, "which", lambda _command, path=None: None)

    result = tf_validator.validate_terraform("terraform {}")

    assert result.success is False
    assert result.formatted_code == "terraform {}"
    assert len(result.logs) == 1
    assert result.logs[0].command == "terraform"
    assert result.logs[0].return_code == 127
    assert result.logs[0].stdout == ""
    assert "Terraform CLI not found" in result.logs[0].stderr
    assert result.security_scan.status == "not_run"
    assert "stdout:" in result.combined_log()
    assert "stderr:" in result.combined_log()


def test_validate_terraform_runs_commands_in_order_and_preserves_formatted_code(
    monkeypatch,
) -> None:
    commands_run: list[tuple[list[str], Path]] = []

    def fake_run(command, cwd, capture_output, text, check, timeout):
        assert capture_output is True
        assert text is True
        assert check is False
        assert timeout == 120

        working_directory = Path(cwd)
        commands_run.append((list(command), working_directory))
        main_tf_path = working_directory / "main.tf"
        assert main_tf_path.exists()

        if command[1] == "fmt":
            assert main_tf_path.read_text(encoding="utf-8") == "terraform {}\n"
            main_tf_path.write_text(
                'terraform {\n  required_version = ">= 1.6.0"\n}\n',
                encoding="utf-8",
            )
            return SimpleNamespace(returncode=0, stdout="main.tf", stderr="")

        if command[1] == "init":
            return SimpleNamespace(
                returncode=0,
                stdout="Terraform has been successfully initialized!",
                stderr="",
            )

        if command[1] == "validate":
            return SimpleNamespace(returncode=0, stdout="Success!", stderr="")

        if command[0] == "/usr/bin/checkov":
            return SimpleNamespace(
                returncode=0,
                stdout='{"results": {"failed_checks": []}}',
                stderr="",
            )

        raise AssertionError(f"Unexpected command: {command}")

    monkeypatch.setattr(tf_validator.shutil, "which", fake_which)
    monkeypatch.setattr(tf_validator.subprocess, "run", fake_run)

    result = tf_validator.validate_terraform("terraform {}")

    assert result.success is True
    assert result.formatted_code == 'terraform {\n  required_version = ">= 1.6.0"\n}'
    assert [command for command, _ in commands_run] == [
        ["/usr/bin/terraform", "fmt", "main.tf"],
        [
            "/usr/bin/terraform",
            "init",
            "-backend=false",
            "-input=false",
            "-no-color",
        ],
        ["/usr/bin/terraform", "validate", "-no-color"],
        [
            "/usr/bin/checkov",
            "-d",
            ".",
            "--framework",
            "terraform",
            "--output",
            "json",
        ],
    ]

    working_directories = [cwd for _, cwd in commands_run]
    assert len({str(cwd) for cwd in working_directories}) == 1
    assert working_directories[0].name.startswith("terraform-validator-")
    assert not working_directories[0].exists()

    assert [log.command for log in result.logs] == [
        "/usr/bin/terraform fmt main.tf",
        "/usr/bin/terraform init -backend=false -input=false -no-color",
        "/usr/bin/terraform validate -no-color",
    ]
    assert result.logs[0].stdout == "main.tf"
    assert result.logs[1].stdout == "Terraform has been successfully initialized!"
    assert result.logs[2].stdout == "Success!"
    assert result.security_scan.status == "passed"
    assert result.security_scan.findings == []
    assert result.security_scan.log is not None
    assert result.security_scan.log.command == (
        "/usr/bin/checkov -d . --framework terraform --output json"
    )
    assert {command[1] for command, _ in commands_run}.isdisjoint({"apply", "destroy"})


def test_validate_terraform_stops_after_timeout_and_returns_readable_log(
    monkeypatch,
) -> None:
    commands_run: list[list[str]] = []

    def fake_run(command, cwd, capture_output, text, check, timeout):
        commands_run.append(list(command))

        if command[1] == "fmt":
            return SimpleNamespace(returncode=0, stdout="main.tf", stderr="")

        if command[1] == "init":
            raise tf_validator.subprocess.TimeoutExpired(
                command,
                timeout,
                output="partial init output",
                stderr="terraform init stalled",
            )

        raise AssertionError(f"Unexpected command after timeout: {command}")

    monkeypatch.setattr(tf_validator.shutil, "which", fake_which)
    monkeypatch.setattr(tf_validator.subprocess, "run", fake_run)

    result = tf_validator.validate_terraform("terraform {}")

    assert result.success is False
    assert commands_run == [
        ["/usr/bin/terraform", "fmt", "main.tf"],
        [
            "/usr/bin/terraform",
            "init",
            "-backend=false",
            "-input=false",
            "-no-color",
        ],
    ]
    assert len(result.logs) == 2
    assert result.logs[1].return_code == 124
    assert result.logs[1].stdout == "partial init output"
    assert "Command timed out after 120 seconds." in result.logs[1].stderr
    assert "terraform init stalled" in result.logs[1].stderr
    assert result.security_scan.status == "not_run"
    assert "/usr/bin/terraform validate -no-color" not in result.combined_log()


def test_validate_terraform_captures_blocking_checkov_findings(monkeypatch) -> None:
    def fake_run(command, cwd, capture_output, text, check, timeout):
        if command[0] == "/usr/bin/checkov":
            return SimpleNamespace(
                returncode=1,
                stdout=(
                    '{"results": {"failed_checks": ['
                    '{"check_id": "CKV_AWS_20", '
                    '"check_name": "S3 Bucket has an ACL defined which allows '
                    'public READ access.", '
                    '"resource": "aws_s3_bucket.demo", '
                    '"repo_file_path": "/main.tf", '
                    '"file_line_range": [1, 3], '
                    '"guideline": "https://docs.bridgecrew.io/docs/s3_2-acl-read-permissions-everyone"'
                    "}]}}"
                ),
                stderr="",
            )

        if command[1] == "fmt":
            return SimpleNamespace(returncode=0, stdout="main.tf", stderr="")

        if command[1] == "init":
            return SimpleNamespace(returncode=0, stdout="Initialized", stderr="")

        if command[1] == "validate":
            return SimpleNamespace(returncode=0, stdout="Success!", stderr="")

        raise AssertionError(f"Unexpected command: {command}")

    monkeypatch.setattr(tf_validator.shutil, "which", fake_which)
    monkeypatch.setattr(tf_validator.subprocess, "run", fake_run)

    result = tf_validator.validate_terraform('resource "aws_s3_bucket" "demo" {}')

    assert result.success is True
    assert result.security_scan.status == "failed"
    assert len(result.security_scan.findings) == 1
    assert result.security_scan.findings[0].check_id == "CKV_AWS_20"
    assert result.security_scan.findings[0].resource == "aws_s3_bucket.demo"
    assert result.security_scan.findings[0].file_line_range == "1-3"
    assert "blocking security finding" in result.security_scan.message


@pytest.mark.parametrize(
    ("stdout", "expected_message"),
    [
        ("not-json", "invalid JSON"),
        ('{"summary": {"failed": 0}}', "results object"),
        ('{"results": {"failed_checks": {}}}', "failed_checks list"),
    ],
)
def test_validate_terraform_treats_malformed_checkov_output_as_scan_error(
    monkeypatch,
    stdout: str,
    expected_message: str,
) -> None:
    def fake_run(command, cwd, capture_output, text, check, timeout):
        if command[0] == "/usr/bin/checkov":
            return SimpleNamespace(returncode=0, stdout=stdout, stderr="")

        if command[1] == "fmt":
            return SimpleNamespace(returncode=0, stdout="main.tf", stderr="")

        if command[1] == "init":
            return SimpleNamespace(returncode=0, stdout="Initialized", stderr="")

        if command[1] == "validate":
            return SimpleNamespace(returncode=0, stdout="Success!", stderr="")

        raise AssertionError(f"Unexpected command: {command}")

    monkeypatch.setattr(tf_validator.shutil, "which", fake_which)
    monkeypatch.setattr(tf_validator.subprocess, "run", fake_run)

    result = tf_validator.validate_terraform('resource "aws_s3_bucket" "demo" {}')

    assert result.success is True
    assert result.security_scan.status == "scan_error"
    assert result.security_scan.findings == []
    assert expected_message in result.security_scan.message


def test_validate_terraform_reports_missing_checkov(monkeypatch) -> None:
    def fake_run(command, cwd, capture_output, text, check, timeout):
        if command[1] == "fmt":
            return SimpleNamespace(returncode=0, stdout="main.tf", stderr="")

        if command[1] == "init":
            return SimpleNamespace(returncode=0, stdout="Initialized", stderr="")

        if command[1] == "validate":
            return SimpleNamespace(returncode=0, stdout="Success!", stderr="")

        raise AssertionError(f"Unexpected command: {command}")

    monkeypatch.setattr(
        tf_validator.shutil,
        "which",
        lambda command, path=None: "/usr/bin/terraform"
        if command == "terraform"
        else None,
    )
    monkeypatch.setattr(tf_validator.subprocess, "run", fake_run)

    result = tf_validator.validate_terraform("terraform {}")

    assert result.success is True
    assert result.security_scan.status == "scanner_unavailable"
    assert result.security_scan.findings == []
    assert result.security_scan.log is not None
    assert result.security_scan.log.command == "checkov"
    assert "Checkov CLI not found" in result.security_scan.message


def test_validate_terraform_finds_checkov_in_current_python_environment(
    monkeypatch,
) -> None:
    commands_run: list[list[str]] = []

    def fake_run(command, cwd, capture_output, text, check, timeout):
        commands_run.append(list(command))

        if command[1] == "fmt":
            return SimpleNamespace(returncode=0, stdout="main.tf", stderr="")

        if command[1] == "init":
            return SimpleNamespace(returncode=0, stdout="Initialized", stderr="")

        if command[1] == "validate":
            return SimpleNamespace(returncode=0, stdout="Success!", stderr="")

        if command[0] == "/workspace/.venv/bin/checkov":
            return SimpleNamespace(
                returncode=0,
                stdout='{"results": {"failed_checks": []}}',
                stderr="",
            )

        raise AssertionError(f"Unexpected command: {command}")

    def fake_env_which(command: str, path: str | None = None) -> str | None:
        if command == "terraform":
            return "/usr/bin/terraform"

        if command == "checkov" and path == "/workspace/.venv/bin":
            return "/workspace/.venv/bin/checkov"

        return None

    monkeypatch.setattr(tf_validator.shutil, "which", fake_env_which)
    monkeypatch.setattr(
        tf_validator.sysconfig,
        "get_path",
        lambda key: "/workspace/.venv/bin",
    )
    monkeypatch.setattr(tf_validator.subprocess, "run", fake_run)

    result = tf_validator.validate_terraform("terraform {}")

    assert result.success is True
    assert result.security_scan.status == "passed"
    assert result.security_scan.log is not None
    assert result.security_scan.log.command == (
        "/workspace/.venv/bin/checkov -d . --framework terraform --output json"
    )
    assert commands_run[-1][0] == "/workspace/.venv/bin/checkov"
