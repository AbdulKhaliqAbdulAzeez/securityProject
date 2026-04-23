from __future__ import annotations

from fastapi.testclient import TestClient

from backend import api
from backend.ai_generator import GenerationResult
from backend.tf_validator import CommandLog, ValidationResult

client = TestClient(api.app)


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
    assert body["security"]["status"] == "queued"
    assert body["readiness"]["is_ready"] is False
    assert body["readiness"]["status"] == "pending_security"


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
        ),
    )

    response = client.post("/workflow", json={"prompt": "Create infrastructure"})

    assert response.status_code == 200
    body = response.json()
    assert body["generation"]["status"] == "fallback"
    assert body["validation"]["status"] == "failed"
    assert body["validation"]["combined_log"] == (
        "$ terraform\n\nexit code: 127\n\nstdout:\n\nstderr:\n"
        "Terraform CLI not found on PATH."
    )
    assert body["readiness"]["status"] == "blocked_by_validation"
