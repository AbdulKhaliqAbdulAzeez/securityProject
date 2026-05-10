from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from fastapi.encoders import jsonable_encoder

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


class RouteResponse:
    def __init__(self, status_code: int, body: dict[str, Any]) -> None:
        self.status_code = status_code
        self._body = body

    def json(self) -> dict[str, Any]:
        return self._body


def post_workflow(prompt: str) -> RouteResponse:
    try:
        response = api.submit_workflow(api.WorkflowRequest(prompt=prompt))
    except HTTPException as error:
        return RouteResponse(error.status_code, {"detail": error.detail})

    return RouteResponse(200, jsonable_encoder(response))


def post_deploy(prompt: str, terraform_code: str) -> RouteResponse:
    try:
        response = api.submit_deploy(
            api.DeployRequest(prompt=prompt, terraform_code=terraform_code)
        )
    except HTTPException as error:
        return RouteResponse(error.status_code, {"detail": error.detail})

    return RouteResponse(200, jsonable_encoder(response))


def post_fix(
    *,
    prompt: str,
    terraform_code: str,
    validation_errors: str = "",
    security_findings: str = "",
    readiness_status: str = "",
    validation_status: str = "",
    security_status: str = "",
    security_finding_count: int = 0,
) -> RouteResponse:
    try:
        response = api.submit_fix(
            api.FixRequest(
                prompt=prompt,
                terraform_code=terraform_code,
                validation_errors=validation_errors,
                security_findings=security_findings,
                readiness_status=readiness_status,
                validation_status=validation_status,
                security_status=security_status,
                security_finding_count=security_finding_count,
            )
        )
    except HTTPException as error:
        return RouteResponse(error.status_code, {"detail": error.detail})

    return RouteResponse(200, jsonable_encoder(response))


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

    response = post_workflow("Create an AWS S3 bucket")

    assert response.status_code == 200
    body = response.json()
    assert body["request"] == {"prompt": "Create an AWS S3 bucket"}
    assert body["generation"] == {
        "status": "succeeded",
        "used_fallback": False,
        "message": "Terraform generated successfully from the Gemini-backed model.",
        "repair_attempts": 0,
        "repair_applied": False,
        "repair_exhausted": False,
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


def test_submit_workflow_runs_automatic_repair_after_initial_failure(
    monkeypatch,
) -> None:
    captured_fix_request: dict[str, object] = {}
    validation_calls: list[str] = []

    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform='resource "aws_s3_bucket" "demo" {}',
            used_fallback=False,
            message="Terraform generated successfully from the Gemini-backed model.",
        ),
    )

    def fake_generate_fixed_terraform_result(*args, **kwargs):
        captured_fix_request["args"] = args
        captured_fix_request["kwargs"] = kwargs
        return GenerationResult(
            terraform=(
                'resource "aws_s3_bucket" "demo" {\n  tags = { Fixed = "true" }\n}'
            ),
            used_fallback=False,
            message="Terraform successfully auto-fixed from the Gemini model.",
        )

    monkeypatch.setattr(
        api,
        "generate_fixed_terraform_result",
        fake_generate_fixed_terraform_result,
    )

    def fake_validate_terraform(terraform_code: str) -> ValidationResult:
        validation_calls.append(terraform_code)

        if len(validation_calls) == 1:
            return ValidationResult(
                success=False,
                formatted_code=terraform_code,
                logs=[
                    CommandLog(
                        command="terraform validate -no-color",
                        return_code=1,
                        stdout="",
                        stderr="Missing required argument",
                    )
                ],
                security_scan=create_security_scan_result(
                    status="not_run",
                    message=(
                        "Security scanning did not run because Terraform "
                        "validation failed."
                    ),
                ),
            )

        return ValidationResult(
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
        )

    monkeypatch.setattr(api, "validate_terraform", fake_validate_terraform)

    response = post_workflow("Create an AWS S3 bucket")

    assert response.status_code == 200
    body = response.json()
    assert len(validation_calls) == 2
    assert captured_fix_request["args"] == (
        "Create an AWS S3 bucket",
        'resource "aws_s3_bucket" "demo" {}',
        (
            "$ terraform validate -no-color\n\nexit code: 1\n\nstdout:\n\n"
            "stderr:\nMissing required argument"
        ),
        "Security scanning did not run because Terraform validation failed.",
    )
    assert captured_fix_request["kwargs"] == {
        "readiness_status": "blocked_by_validation",
        "validation_status": "failed",
        "security_status": "not_run",
        "security_finding_count": 0,
        "repair_attempt_number": 1,
    }
    assert body["validation"]["status"] == "passed"
    assert body["security"]["status"] == "passed"
    assert body["readiness"]["is_ready"] is True
    assert body["generation"]["repair_attempts"] == 1
    assert body["generation"]["repair_applied"] is True
    assert body["generation"]["repair_exhausted"] is False
    assert (
        "Automatic repair pass succeeded after 1 attempt."
        in body["generation"]["message"]
    )


def test_submit_workflow_skips_automatic_repair_when_initial_result_is_ready(
    monkeypatch,
) -> None:
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
        "generate_fixed_terraform_result",
        lambda *args, **kwargs: (_ for _ in ()).throw(
            AssertionError("repair should not run for ready output")
        ),
    )
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[],
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

    response = post_workflow("Create an AWS S3 bucket")

    assert response.status_code == 200
    body = response.json()
    assert body["readiness"]["status"] == "ready"
    assert body["generation"]["repair_attempts"] == 0
    assert body["generation"]["repair_applied"] is False
    assert body["generation"]["repair_exhausted"] is False
    assert "Automatic repair pass" not in body["generation"]["message"]


def test_submit_workflow_repairs_until_later_attempt_succeeds(monkeypatch) -> None:
    repair_attempts: list[int] = []

    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform="initial terraform",
            used_fallback=False,
            message="Terraform generated successfully from the Gemini-backed model.",
        ),
    )

    def fake_generate_fixed_terraform_result(*args, **kwargs):
        repair_attempts.append(kwargs["repair_attempt_number"])
        return GenerationResult(
            terraform=f"repaired attempt {kwargs['repair_attempt_number']}",
            used_fallback=False,
            message="Terraform successfully auto-fixed from the Gemini model.",
        )

    monkeypatch.setattr(
        api,
        "generate_fixed_terraform_result",
        fake_generate_fixed_terraform_result,
    )

    def fake_validate_terraform(terraform_code: str) -> ValidationResult:
        if terraform_code == "initial terraform":
            return ValidationResult(
                success=True,
                formatted_code=terraform_code,
                logs=[],
                security_scan=create_security_scan_result(
                    status="failed",
                    message="Checkov reported 1 blocking security finding.",
                    findings=[
                        SecurityFinding(
                            check_id="CKV_AWS_20",
                            check_name="Finding",
                            resource="aws_s3_bucket.demo",
                            file_path="/main.tf",
                            file_line_range="1-3",
                            guideline="",
                        )
                    ],
                ),
            )
        if terraform_code == "repaired attempt 1":
            return ValidationResult(
                success=True,
                formatted_code=terraform_code,
                logs=[],
                security_scan=create_security_scan_result(
                    status="failed",
                    message="Checkov reported 1 blocking security finding.",
                    findings=[
                        SecurityFinding(
                            check_id="CKV_AWS_21",
                            check_name="Finding",
                            resource="aws_s3_bucket.demo",
                            file_path="/main.tf",
                            file_line_range="1-3",
                            guideline="",
                        )
                    ],
                ),
            )

        return ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[],
            security_scan=create_security_scan_result(
                log=CommandLog(
                    command="checkov -d . --framework terraform --output json",
                    return_code=0,
                    stdout='{"results": {"failed_checks": []}}',
                    stderr="",
                )
            ),
        )

    monkeypatch.setattr(api, "validate_terraform", fake_validate_terraform)

    response = post_workflow("Create an AWS S3 bucket")

    assert response.status_code == 200
    body = response.json()
    assert repair_attempts == [1, 2]
    assert body["generation"]["repair_attempts"] == 2
    assert body["generation"]["repair_applied"] is True
    assert body["generation"]["repair_exhausted"] is False
    assert body["readiness"]["status"] == "ready"


def test_submit_workflow_stops_after_three_failed_repairs(monkeypatch) -> None:
    repair_attempts: list[int] = []

    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform="initial terraform",
            used_fallback=False,
            message="Terraform generated successfully from the Gemini-backed model.",
        ),
    )

    def fake_generate_fixed_terraform_result(*args, **kwargs):
        repair_attempts.append(kwargs["repair_attempt_number"])
        return GenerationResult(
            terraform=f"repaired attempt {kwargs['repair_attempt_number']}",
            used_fallback=False,
            message="Terraform successfully auto-fixed from the Gemini model.",
        )

    monkeypatch.setattr(
        api,
        "generate_fixed_terraform_result",
        fake_generate_fixed_terraform_result,
    )

    def fake_validate_terraform(terraform_code: str) -> ValidationResult:
        return ValidationResult(
            success=False,
            formatted_code=terraform_code,
            logs=[
                CommandLog(
                    command="terraform validate -no-color",
                    return_code=1,
                    stdout="",
                    stderr="Still failing",
                )
            ],
            security_scan=create_security_scan_result(
                status="not_run",
                message=(
                    "Security scanning did not run because Terraform validation failed."
                ),
            ),
        )

    monkeypatch.setattr(api, "validate_terraform", fake_validate_terraform)

    response = post_workflow("Create an AWS S3 bucket")

    assert response.status_code == 200
    body = response.json()
    assert repair_attempts == [1, 2, 3]
    assert body["generation"]["repair_attempts"] == 3
    assert body["generation"]["repair_applied"] is True
    assert body["generation"]["repair_exhausted"] is True
    assert body["readiness"]["status"] == "blocked_by_validation"
    assert body["terraform"]["generated_code"] == "repaired attempt 3"
    assert (
        "Automatic repair pass stopped after 3 attempts."
        in body["generation"]["message"]
    )


def test_submit_workflow_does_not_repair_scanner_unavailable(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform="terraform {}",
            used_fallback=False,
            message="Terraform generated successfully from the Gemini-backed model.",
        ),
    )
    monkeypatch.setattr(
        api,
        "generate_fixed_terraform_result",
        lambda *args, **kwargs: (_ for _ in ()).throw(
            AssertionError("repair should not run for scanner setup failures")
        ),
    )
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[],
            security_scan=create_security_scan_result(
                status="scanner_unavailable",
                message="Checkov CLI not found on PATH.",
                log=CommandLog(
                    command="checkov",
                    return_code=127,
                    stdout="",
                    stderr="Checkov CLI not found on PATH.",
                ),
            ),
        ),
    )

    response = post_workflow("Create infrastructure")

    assert response.status_code == 200
    body = response.json()
    assert body["generation"]["repair_attempts"] == 0
    assert body["generation"]["repair_applied"] is False
    assert body["readiness"]["status"] == "blocked_by_security_setup"


def test_submit_workflow_does_not_repair_scan_error(monkeypatch) -> None:
    monkeypatch.setattr(
        api,
        "generate_terraform_result",
        lambda prompt: GenerationResult(
            terraform="terraform {}",
            used_fallback=False,
            message="Terraform generated successfully from the Gemini-backed model.",
        ),
    )
    monkeypatch.setattr(
        api,
        "generate_fixed_terraform_result",
        lambda *args, **kwargs: (_ for _ in ()).throw(
            AssertionError("repair should not run for scan errors")
        ),
    )
    monkeypatch.setattr(
        api,
        "validate_terraform",
        lambda terraform_code: ValidationResult(
            success=True,
            formatted_code=terraform_code,
            logs=[],
            security_scan=create_security_scan_result(
                status="scan_error",
                message="Checkov did not complete successfully.",
                log=CommandLog(
                    command="checkov -d . --framework terraform --output json",
                    return_code=1,
                    stdout="not-json",
                    stderr="scanner error",
                ),
            ),
        ),
    )

    response = post_workflow("Create infrastructure")

    assert response.status_code == 200
    body = response.json()
    assert body["generation"]["repair_attempts"] == 0
    assert body["generation"]["repair_applied"] is False
    assert body["readiness"]["status"] == "blocked_by_security_scan"


def test_submit_workflow_rejects_blank_prompt() -> None:
    response = post_workflow("   ")

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
        "generate_fixed_terraform_result",
        lambda *args, **kwargs: GenerationResult(
            terraform="terraform {}",
            used_fallback=True,
            message="Terraform auto-fix did not resolve the validation failure.",
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

    response = post_workflow("Create infrastructure")

    assert response.status_code == 200
    body = response.json()
    assert body["generation"]["status"] == "fallback"
    assert body["generation"]["repair_attempts"] == 3
    assert body["generation"]["repair_applied"] is True
    assert body["generation"]["repair_exhausted"] is True
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
        "generate_fixed_terraform_result",
        lambda *args, **kwargs: GenerationResult(
            terraform='resource "aws_s3_bucket" "demo" {}',
            used_fallback=False,
            message="Terraform auto-fix did not resolve the security findings.",
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

    response = post_workflow("Create an AWS S3 bucket")

    assert response.status_code == 200
    body = response.json()
    assert body["generation"]["repair_attempts"] == 3
    assert body["generation"]["repair_applied"] is True
    assert body["generation"]["repair_exhausted"] is True
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

    response = post_workflow("Create an AWS S3 bucket")

    assert response.status_code == 200
    body = response.json()
    assert body["security"]["status"] == "scanner_unavailable"
    assert body["security"]["log"]["command"] == "checkov"
    assert body["readiness"]["is_ready"] is False
    assert body["readiness"]["status"] == "blocked_by_security_setup"


def test_submit_fix_accepts_legacy_payload_without_metadata(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_generate_fixed_terraform_result(*args, **kwargs):
        captured["args"] = args
        captured["kwargs"] = kwargs
        return GenerationResult(
            terraform='resource "aws_s3_bucket" "demo" {}',
            used_fallback=False,
            message="Terraform successfully auto-fixed from the Gemini model.",
        )

    monkeypatch.setattr(
        api,
        "generate_fixed_terraform_result",
        fake_generate_fixed_terraform_result,
    )
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

    response = post_fix(
        prompt="Create an AWS S3 bucket",
        terraform_code='resource "aws_s3_bucket" "demo" {}',
    )

    assert response.status_code == 200
    assert captured["args"] == (
        "Create an AWS S3 bucket",
        'resource "aws_s3_bucket" "demo" {}',
        "",
        "",
    )
    assert captured["kwargs"] == {
        "readiness_status": "",
        "validation_status": "",
        "security_status": "",
        "security_finding_count": 0,
    }


def test_submit_fix_forwards_hidden_repair_metadata(monkeypatch) -> None:
    captured: dict[str, object] = {}

    def fake_generate_fixed_terraform_result(*args, **kwargs):
        captured["args"] = args
        captured["kwargs"] = kwargs
        return GenerationResult(
            terraform='resource "aws_s3_bucket" "demo" {}',
            used_fallback=False,
            message="Terraform successfully auto-fixed from the Gemini model.",
        )

    monkeypatch.setattr(
        api,
        "generate_fixed_terraform_result",
        fake_generate_fixed_terraform_result,
    )
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

    response = post_fix(
        prompt="Create an AWS S3 bucket",
        terraform_code='resource "aws_s3_bucket" "demo" {}',
        security_findings="CKV_AWS_20 on aws_s3_bucket.demo",
        readiness_status="blocked_by_security",
        validation_status="passed",
        security_status="failed",
        security_finding_count=1,
    )

    assert response.status_code == 200
    assert captured["args"] == (
        "Create an AWS S3 bucket",
        'resource "aws_s3_bucket" "demo" {}',
        "",
        "CKV_AWS_20 on aws_s3_bucket.demo",
    )
    assert captured["kwargs"] == {
        "readiness_status": "blocked_by_security",
        "validation_status": "passed",
        "security_status": "failed",
        "security_finding_count": 1,
    }


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

    response = post_deploy(
        "Create an AWS S3 bucket",
        'resource "aws_s3_bucket" "demo" {}',
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

    response = post_deploy("Create infrastructure", "terraform {}")

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

    response = post_deploy("Create infrastructure", "terraform {}")

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

    response = post_deploy("Create infrastructure", "terraform {}")

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

    response = post_deploy("Create infrastructure", "terraform {}")

    assert response.status_code == 502
    assert response.json() == {
        "detail": (
            "GitHub delivery failed. Check repository access, branch settings, and "
            "pull-request permissions."
        )
    }
