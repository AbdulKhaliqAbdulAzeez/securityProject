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


class SecurityFindingPayload(BaseModel):
    check_id: str
    check_name: str
    resource: str
    file_path: str
    file_line_range: str
    guideline: str


class SecurityPayload(BaseModel):
    status: str
    message: str
    findings: list[SecurityFindingPayload]
    log: ValidationLogPayload | None


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
    security_result = validation_result.security_scan

    validation_status = "passed" if validation_result.success else "failed"
    validation_message = (
        "Terraform validation passed."
        if validation_result.success
        else "Terraform validation failed. Review the command logs below."
    )

    if validation_result.success:
        if security_result.status == "passed":
            readiness_is_ready = True
            readiness_status = "ready"
            readiness_message = (
                "Terraform validation and Checkov security scanning passed. "
                "This document is ready for the later GitOps handoff."
            )
        elif security_result.status == "failed":
            readiness_is_ready = False
            readiness_status = "blocked_by_security"
            readiness_message = (
                "Checkov reported blocking security findings, so deployment "
                "remains blocked until the issues are resolved."
            )
        elif security_result.status == "scanner_unavailable":
            readiness_is_ready = False
            readiness_status = "blocked_by_security_setup"
            readiness_message = (
                "Terraform validation passed, but security scanning is blocked "
                "until Checkov is installed locally."
            )
        else:
            readiness_is_ready = False
            readiness_status = "blocked_by_security_scan"
            readiness_message = (
                "Terraform validation passed, but the Checkov scan did not "
                "complete successfully."
            )
    else:
        readiness_is_ready = False
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
            status=security_result.status,
            message=security_result.message,
            findings=[
                SecurityFindingPayload(**asdict(finding))
                for finding in security_result.findings
            ],
            log=(
                ValidationLogPayload(**asdict(security_result.log))
                if security_result.log is not None
                else None
            ),
        ),
        readiness=ReadinessPayload(
            is_ready=readiness_is_ready,
            status=readiness_status,
            message=readiness_message,
            deploy_hint=(
                "Deploy to GitHub remains disabled until Sprint 4 adds GitOps "
                "delivery, even when validation and security scanning pass."
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
