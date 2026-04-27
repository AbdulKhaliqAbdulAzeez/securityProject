from __future__ import annotations

from fastapi.testclient import TestClient

from backend import api
from backend.ai_generator import GenerationResult
from backend.tf_validator import (
    CommandLog,
    SecurityFinding,
    SecurityScanResult,
    ValidationResult,
)

client = TestClient(api.app)


def create_security_scan_result(
    *,
    status: str = "passed",
    message: str = "Checkov security scan passed with no blocking findings.",
    findings: list[SecurityFinding] | None = None,
    log: CommandLog | None = None,
) -> SecurityScanResult:
    return SecurityScanResult(
        status=status,
        message=message,
        findings=findings or [],
        log=log,
    )


def test_submit_workflow_returns_contract(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform='resource "aws_s3_bucket" "demo" {}',
            used_fallback=False,
            message="Terraform generated successfully from the Gemini-backed model.",
        ),
    )
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[
                CommandLog(
                    command="terraform validate -no-color",
                    return_code=0,
                    stdout="Success!",
                    stderr="",
                )
            ],
            security_scan=create_security_scan_result(
                log=CommandLog(
                    command="checkov -d . --framework terraform --output json",
                    return_code=0,
                    stdout='{"results": {"failed_checks": []}}',
                    stderr="",
                )
            ),
        ),
    )

    response = client.post("/workflow", json={"prompt": "Create an AWS S3 bucket"})

    assert response.status_code == 200
    body = response.json()
    assert body["request"] == {"prompt": "Create an AWS S3 bucket"}
    assert body["generation"] == {
        "status": "succeeded",
        "used_fallback": False,
        "message": "Terraform generated successfully from the Gemini-backed model.",
    }
    assert body["terraform"] == {
        "generated_code": 'resource "aws_s3_bucket" "demo" {}',
        "formatted_code": 'resource "aws_s3_bucket" "demo" {}',
    }
    assert body["validation"]["status"] == "passed"
    assert body["validation"]["logs"][0]["command"] == "terraform validate -no-color"
    assert body["security"]["status"] == "passed"
    assert body["security"]["findings"] == []
    assert body["security"]["log"]["command"] == (
        "checkov -d . --framework terraform --output json"
    )
    assert body["readiness"]["is_ready"] is True
    assert body["readiness"]["status"] == "ready"


def test_submit_workflow_rejects_blank_prompt() -> None:
    response = client.post("/workflow", json={"prompt": "   "})

    assert response.status_code == 400
    assert response.json() == {
        "detail": "A natural-language infrastructure request is required."
    }


def test_submit_workflow_preserves_validation_failure_details(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform="terraform {}",
            used_fallback=True,
            message=(
                "No Gemini API key is configured. Using the safe fallback "
                "Terraform document instead of a live model response."
            ),
        ),
    )
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=False,
            formatted_code=terraform_code,
            logs=[
                CommandLog(
                    command="terraform",
                    return_code=127,
                    stdout="",
                    stderr="Terraform CLI not found on PATH.",
                )
            ],
            security_scan=create_security_scan_result(
                status="not_run",
                message=(
                    "Security scanning did not run because Terraform validation failed."
                ),
            ),
        ),
    )

    response = client.post("/workflow", json={"prompt": "Create infrastructure"})

    assert response.status_code == 200
    body = response.json()
    assert body["generation"]["status"] == "fallback"
    assert body["validation"]["status"] == "failed"
    assert body["security"]["status"] == "not_run"
    assert body["validation"]["combined_log"] == (
        "$ terraform\n\nexit code: 127\n\nstdout:\n\nstderr:\n"
        "Terraform CLI not found on PATH."
    )
    assert body["readiness"]["status"] == "blocked_by_validation"


def test_submit_workflow_blocks_readiness_on_checkov_findings(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform='resource "aws_s3_bucket" "demo" {}',
            used_fallback=False,
            message="Terraform generated successfully from the Gemini-backed model.",
        ),
    )
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[
                CommandLog(
                    command="terraform validate -no-color",
                    return_code=0,
                    stdout="Success!",
                    stderr="",
                )
            ],
            security_scan=create_security_scan_result(
                status="failed",
                message=(
                    "Checkov reported 1 blocking security finding. Review the "
                    "findings below before treating this Terraform as ready."
                ),
                findings=[
                    SecurityFinding(
                        check_id="CKV_AWS_20",
                        check_name=(
                            "S3 Bucket has an ACL defined which allows public READ "
                            "access."
                        ),
                        resource="aws_s3_bucket.demo",
                        file_path="/main.tf",
                        file_line_range="1-3",
                        guideline=(
                            "https://docs.bridgecrew.io/docs/s3_2-acl-read-permissions-everyone"
                        ),
                    )
                ],
                log=CommandLog(
                    command="checkov -d . --framework terraform --output json",
                    return_code=1,
                    stdout=(
                        '{"results": {"failed_checks": [{"check_id": "CKV_AWS_20"}]}}'
                    ),
                    stderr="",
                ),
            ),
        ),
    )

    response = client.post("/workflow", json={"prompt": "Create an AWS S3 bucket"})

    assert response.status_code == 200
    body = response.json()
    assert body["security"]["status"] == "failed"
    assert body["security"]["findings"][0]["check_id"] == "CKV_AWS_20"
    assert body["readiness"]["is_ready"] is False
    assert body["readiness"]["status"] == "blocked_by_security"


def test_submit_workflow_blocks_readiness_when_checkov_is_missing(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform='resource "aws_s3_bucket" "demo" {}',
            used_fallback=False,
            message="Terraform generated successfully from the Gemini-backed model.",
        ),
    )
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[
                CommandLog(
                    command="terraform validate -no-color",
                    return_code=0,
                    stdout="Success!",
                    stderr="",
                )
            ],
            security_scan=create_security_scan_result(
                status="scanner_unavailable",
                message=(
                    "Checkov CLI not found on PATH. Install Checkov locally before "
                    "running security scanning."
                ),
                log=CommandLog(
                    command="checkov",
                    return_code=127,
                    stdout="",
                    stderr=(
                        "Checkov CLI not found on PATH. Install Checkov locally "
                        "before running security scanning."
                    ),
                ),
            ),
        ),
    )

    response = client.post("/workflow", json={"prompt": "Create an AWS S3 bucket"})

    assert response.status_code == 200
    body = response.json()
    assert body["security"]["status"] == "scanner_unavailable"
    assert body["security"]["log"]["command"] == "checkov"
    assert body["readiness"]["is_ready"] is False
    assert body["readiness"]["status"] == "blocked_by_security_setup"
