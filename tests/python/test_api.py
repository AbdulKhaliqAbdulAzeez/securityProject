from __future__ import annotations

from fastapi.testclient import TestClient

from backend import api
from backend.ai_generator import GenerationResult
from backend.gitops_manager import (
    GitOpsConfigurationError,
    GitOpsDeliveryError,
    GitOpsDeliveryResult,
)
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


def test_submit_deploy_returns_pull_request_metadata(monkeypatch) -> None:
    captured_delivery: dict[str, str] = {}

    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code='resource "aws_s3_bucket" "demo" {}\n# formatted',
            logs=[],
            security_scan=create_security_scan_result(),
        ),
    )
    monkeypatch.setattr(
        api,
        "deliver_terraform_via_gitops",
        lambda terraform_code, prompt: captured_delivery.update(
            {"terraform_code": terraform_code, "prompt": prompt}
        )
        or GitOpsDeliveryResult(
            branch_name="gitops/terraform-create-an-aws-s3-bucket-abc12345",
            commit_sha="commit-sha",
            pull_request_url="https://github.example/pr/123",
            pull_request_number=123,
        ),
    )

    response = client.post(
        "/deploy",
        json={
            "prompt": "Create an AWS S3 bucket",
            "terraform_code": 'resource "aws_s3_bucket" "demo" {}',
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert captured_delivery == {
        "terraform_code": 'resource "aws_s3_bucket" "demo" {}\n# formatted',
        "prompt": "Create an AWS S3 bucket",
    }
    assert body == {
        "request": {"prompt": "Create an AWS S3 bucket"},
        "delivery": {
            "status": "succeeded",
            "message": "GitOps delivery succeeded. Review the pull request on GitHub.",
            "branch_name": "gitops/terraform-create-an-aws-s3-bucket-abc12345",
            "commit_sha": "commit-sha",
            "pull_request_url": "https://github.example/pr/123",
            "pull_request_number": 123,
        },
    }


def test_submit_deploy_rejects_validation_failure(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=False,
            formatted_code=terraform_code,
            logs=[],
            security_scan=create_security_scan_result(status="not_run"),
        ),
    )

    response = client.post(
        "/deploy",
        json={"prompt": "Create infrastructure", "terraform_code": "terraform {}"},
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": (
            "GitOps delivery is blocked because Terraform validation did not pass. "
            "Re-run the workflow and resolve the validation errors first."
        )
    }


def test_submit_deploy_rejects_checkov_failure(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[],
            security_scan=create_security_scan_result(status="failed"),
        ),
    )

    response = client.post(
        "/deploy",
        json={"prompt": "Create infrastructure", "terraform_code": "terraform {}"},
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": (
            "GitOps delivery is blocked because Checkov did not pass. Re-run the "
            "workflow and resolve the security gate first."
        )
    }


def test_submit_deploy_surfaces_github_configuration_error(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[],
            security_scan=create_security_scan_result(),
        ),
    )
    monkeypatch.setattr(
        api,
        "deliver_terraform_via_gitops",
        lambda terraform_code, prompt: (_ for _ in ()).throw(
            GitOpsConfigurationError(
                "GITHUB_TOKEN is not configured. Set it before running GitOps delivery."
            )
        ),
    )

    response = client.post(
        "/deploy",
        json={"prompt": "Create infrastructure", "terraform_code": "terraform {}"},
    )

    assert response.status_code == 503
    assert response.json() == {
        "detail": (
            "GITHUB_TOKEN is not configured. Set it before running GitOps delivery."
        )
    }


def test_submit_deploy_surfaces_github_delivery_error(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[],
            security_scan=create_security_scan_result(),
        ),
    )
    monkeypatch.setattr(
        api,
        "deliver_terraform_via_gitops",
        lambda terraform_code, prompt: (_ for _ in ()).throw(
            GitOpsDeliveryError(
                "GitHub delivery failed. Check repository access, branch settings, "
                "and pull-request permissions."
            )
        ),
    )

    response = client.post(
        "/deploy",
        json={"prompt": "Create infrastructure", "terraform_code": "terraform {}"},
    )

    assert response.status_code == 502
    assert response.json() == {
        "detail": (
            "GitHub delivery failed. Check repository access, branch settings, and "
            "pull-request permissions."
        )
    }
