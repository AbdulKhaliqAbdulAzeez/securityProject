from __future__ import annotations

from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from backend.ai_generator import generate_terraform_result
from backend.tf_validator import validate_terraform


class WorkflowRequest(BaseModel):
    prompt: str


class WorkflowRequestPayload(BaseModel):
    prompt: str


class GenerationPayload(BaseModel):
    status: str
    used_fallback: bool
    message: str


class TerraformPayload(BaseModel):
    generated_code: str
    formatted_code: str


class ValidationLogPayload(BaseModel):
    command: str
    return_code: int
    stdout: str
    stderr: str


class ValidationPayload(BaseModel):
    status: str
    message: str
    logs: list[ValidationLogPayload]
    combined_log: str


class SecurityPayload(BaseModel):
    status: str
    message: str


class ReadinessPayload(BaseModel):
    is_ready: bool
    status: str
    message: str
    deploy_hint: str


class WorkflowResponse(BaseModel):
    request: WorkflowRequestPayload
    generation: GenerationPayload
    terraform: TerraformPayload
    validation: ValidationPayload
    security: SecurityPayload
    readiness: ReadinessPayload


def build_workflow_response(prompt: str) -> WorkflowResponse:
    generation_result = generate_terraform_result(prompt)
    validation_result = validate_terraform(generation_result.terraform)

    validation_status = "passed" if validation_result.success else "failed"
    validation_message = (
        "Terraform validation passed."
        if validation_result.success
        else "Terraform validation failed. Review the command logs below."
    )

    if validation_result.success:
        readiness_status = "pending_security"
        readiness_message = (
            "Terraform validation passed, but deployment remains blocked until "
            "Sprint 3 "
            "adds security scanning."
        )
    else:
        readiness_status = "blocked_by_validation"
        readiness_message = (
            "Terraform validation failed, so deployment remains blocked until the "
            "validation errors are resolved."
        )

    generation_status = "fallback" if generation_result.used_fallback else "succeeded"

    return WorkflowResponse(
        request=WorkflowRequestPayload(prompt=prompt),
        generation=GenerationPayload(
            status=generation_status,
            used_fallback=generation_result.used_fallback,
            message=generation_result.message,
        ),
        terraform=TerraformPayload(
            generated_code=generation_result.terraform,
            formatted_code=validation_result.formatted_code,
        ),
        validation=ValidationPayload(
            status=validation_status,
            message=validation_message,
            logs=[
                ValidationLogPayload(**asdict(log)) for log in validation_result.logs
            ],
            combined_log=validation_result.combined_log(),
        ),
        security=SecurityPayload(
            status="queued",
            message=(
                "Security scanning is not wired yet. Sprint 3 will add Checkov and "
                "block readiness on findings."
            ),
        ),
        readiness=ReadinessPayload(
            is_ready=False,
            status=readiness_status,
            message=readiness_message,
            deploy_hint=(
                "Deploy to GitHub remains disabled until Sprint 3 adds security "
                "scanning and Sprint 4 adds GitOps delivery."
            ),
        ),
    )


app = FastAPI(title="Terraform Workflow API")


@app.post("/workflow", response_model=WorkflowResponse)
def submit_workflow(request: WorkflowRequest) -> WorkflowResponse:
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="A natural-language infrastructure request is required.",
        )

    try:
        return build_workflow_response(prompt)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


__all__ = ["WorkflowRequest", "WorkflowResponse", "app", "build_workflow_response"]
