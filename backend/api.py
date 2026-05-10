from __future__ import annotations

from dataclasses import asdict, replace

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from backend.ai_generator import (
    GenerationResult,
    generate_fixed_terraform_result,
    generate_terraform_result,
)
from backend.gitops_manager import (
    GitOpsConfigurationError,
    GitOpsDeliveryError,
    deliver_terraform_via_gitops,
)
from backend.tf_validator import SecurityFinding, ValidationResult, validate_terraform


class FixRequest(BaseModel):
    prompt: str
    terraform_code: str
    validation_errors: str
    security_findings: str
    readiness_status: str = ""
    validation_status: str = ""
    security_status: str = ""
    security_finding_count: int = 0


class WorkflowRequest(BaseModel):
    prompt: str


class WorkflowRequestPayload(BaseModel):
    prompt: str


class DeployRequest(BaseModel):
    prompt: str
    terraform_code: str


class GenerationPayload(BaseModel):
    status: str
    used_fallback: bool
    message: str
    repair_attempts: int = 0
    repair_applied: bool = False
    repair_exhausted: bool = False


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


class GitOpsDeliveryPayload(BaseModel):
    status: str
    message: str
    branch_name: str
    commit_sha: str
    pull_request_url: str
    pull_request_number: int


class WorkflowResponse(BaseModel):
    request: WorkflowRequestPayload
    generation: GenerationPayload
    terraform: TerraformPayload
    validation: ValidationPayload
    security: SecurityPayload
    readiness: ReadinessPayload


class DeployResponse(BaseModel):
    request: WorkflowRequestPayload
    delivery: GitOpsDeliveryPayload


MAX_REPAIR_ATTEMPTS = 3


def _build_response(
    prompt: str,
    generation_result: GenerationResult,
    validation_result: ValidationResult,
) -> WorkflowResponse:
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
            repair_attempts=getattr(generation_result, "repair_attempts", 0),
            repair_applied=getattr(generation_result, "repair_applied", False),
            repair_exhausted=getattr(generation_result, "repair_exhausted", False),
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
                "Deploy to GitHub stays gated until validation and Checkov pass, "
                "and delivery always creates a pull request instead of mutating "
                "the default branch."
            ),
        ),
    )


def _format_security_findings_for_fix(
    findings: list[SecurityFinding],
    message: str,
) -> str:
    normalized_message = message.strip()
    if not findings:
        return normalized_message

    formatted_findings = "\n\n".join(
        "\n".join(
            part
            for part in [
                f"Finding {index + 1}",
                f"Check: {finding.check_id} - {finding.check_name}",
                f"Resource: {finding.resource}",
                f"Location: {finding.file_path}:{finding.file_line_range}",
                f"Guideline: {finding.guideline}" if finding.guideline else "",
            ]
            if part
        )
        for index, finding in enumerate(findings)
    )

    return "\n\n".join(
        part for part in [normalized_message, formatted_findings] if part
    )


def _should_attempt_repair(validation_result: ValidationResult) -> bool:
    if not validation_result.success:
        return True

    return validation_result.security_scan.status == "failed"


def _merge_repair_message(
    initial_result: GenerationResult,
    repaired_result: GenerationResult,
    repaired_validation: ValidationResult,
    repair_attempts: int,
    repair_exhausted: bool,
) -> str:
    if (
        repaired_validation.success
        and repaired_validation.security_scan.status == "passed"
    ):
        return (
            f"{initial_result.message} "
            f"Automatic repair pass succeeded after {repair_attempts} attempt"
            f"{'' if repair_attempts == 1 else 's'}."
        )

    if repair_exhausted:
        return (
            f"{initial_result.message} "
            f"Automatic repair pass stopped after {repair_attempts} attempts. "
            "Validation or security issues remain."
        )

    return (
        f"{initial_result.message} "
        f"Automatic repair pass attempted {repair_attempts} time"
        f"{'' if repair_attempts == 1 else 's'}. {repaired_result.message}"
    )


def _run_generation_with_repair(
    prompt: str,
) -> tuple[GenerationResult, ValidationResult]:
    initial_result = generate_terraform_result(prompt)
    initial_validation = validate_terraform(initial_result.terraform)

    if not _should_attempt_repair(initial_validation):
        return (
            replace(
                initial_result,
                repair_attempts=0,
                repair_applied=False,
                repair_exhausted=False,
            ),
            initial_validation,
        )

    current_result = initial_result
    current_validation = initial_validation
    repair_attempts = 0

    for attempt_number in range(1, MAX_REPAIR_ATTEMPTS + 1):
        if not _should_attempt_repair(current_validation):
            break

        repair_attempts = attempt_number
        repaired_result = generate_fixed_terraform_result(
            prompt,
            current_result.terraform,
            current_validation.combined_log() if not current_validation.success else "",
            _format_security_findings_for_fix(
                current_validation.security_scan.findings,
                current_validation.security_scan.message,
            ),
            readiness_status=(
                "blocked_by_validation"
                if not current_validation.success
                else "blocked_by_security"
            ),
            validation_status="failed" if not current_validation.success else "passed",
            security_status=current_validation.security_scan.status,
            security_finding_count=len(current_validation.security_scan.findings),
            repair_attempt_number=attempt_number,
        )
        repaired_validation = validate_terraform(repaired_result.terraform)

        current_result = repaired_result
        current_validation = repaired_validation

        if (
            repaired_validation.success
            and repaired_validation.security_scan.status == "passed"
        ):
            break

        if not _should_attempt_repair(repaired_validation):
            break

    repair_exhausted = (
        repair_attempts == MAX_REPAIR_ATTEMPTS
        and _should_attempt_repair(current_validation)
    )

    return (
        replace(
            current_result,
            used_fallback=initial_result.used_fallback or current_result.used_fallback,
            message=_merge_repair_message(
                initial_result,
                current_result,
                current_validation,
                repair_attempts=repair_attempts,
                repair_exhausted=repair_exhausted,
            ),
            repair_attempts=repair_attempts,
            repair_applied=repair_attempts > 0,
            repair_exhausted=repair_exhausted,
        ),
        current_validation,
    )


def _ensure_gitops_readiness(terraform_code: str) -> str:
    validation_result = validate_terraform(terraform_code)
    if not validation_result.success:
        raise HTTPException(
            status_code=400,
            detail=(
                "GitOps delivery is blocked because Terraform validation did not "
                "pass. Re-run the workflow and resolve the validation errors first."
            ),
        )

    if validation_result.security_scan.status != "passed":
        raise HTTPException(
            status_code=400,
            detail=(
                "GitOps delivery is blocked because Checkov did not pass. Re-run "
                "the workflow and resolve the security gate first."
            ),
        )

    return validation_result.formatted_code


def build_deploy_response(prompt: str, terraform_code: str) -> DeployResponse:
    formatted_code = _ensure_gitops_readiness(terraform_code)

    try:
        delivery_result = deliver_terraform_via_gitops(formatted_code, prompt)
    except GitOpsConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except GitOpsDeliveryError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    return DeployResponse(
        request=WorkflowRequestPayload(prompt=prompt),
        delivery=GitOpsDeliveryPayload(
            status="succeeded",
            message="GitOps delivery succeeded. Review the pull request on GitHub.",
            branch_name=delivery_result.branch_name,
            commit_sha=delivery_result.commit_sha,
            pull_request_url=delivery_result.pull_request_url,
            pull_request_number=delivery_result.pull_request_number,
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
        generation_result, validation_result = _run_generation_with_repair(prompt)
        return _build_response(prompt, generation_result, validation_result)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/fix", response_model=WorkflowResponse)
def submit_fix(request: FixRequest) -> WorkflowResponse:
    prompt = request.prompt.strip()
    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="A natural-language infrastructure request is required.",
        )

    try:
        generation_result = generate_fixed_terraform_result(
            prompt,
            request.terraform_code.strip(),
            request.validation_errors.strip(),
            request.security_findings.strip(),
            readiness_status=request.readiness_status.strip(),
            validation_status=request.validation_status.strip(),
            security_status=request.security_status.strip(),
            security_finding_count=request.security_finding_count,
        )
        validation_result = validate_terraform(generation_result.terraform)
        return _build_response(prompt, generation_result, validation_result)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/deploy", response_model=DeployResponse)
def submit_deploy(request: DeployRequest) -> DeployResponse:
    prompt = request.prompt.strip()
    terraform_code = request.terraform_code.strip()

    if not prompt:
        raise HTTPException(
            status_code=400,
            detail="A natural-language infrastructure request is required.",
        )

    if not terraform_code:
        raise HTTPException(
            status_code=400,
            detail="Terraform code is required for GitOps delivery.",
        )

    try:
        return build_deploy_response(prompt, terraform_code)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


__all__ = [
    "DeployRequest",
    "DeployResponse",
    "FixRequest",
    "WorkflowRequest",
    "WorkflowResponse",
    "app",
    "build_deploy_response",
]
