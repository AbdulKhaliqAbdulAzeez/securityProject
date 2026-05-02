export type WorkflowValidationLog = {
  command: string;
  return_code: number;
  stdout: string;
  stderr: string;
};

export type WorkflowSecurityFinding = {
  check_id: string;
  check_name: string;
  resource: string;
  file_path: string;
  file_line_range: string;
  guideline: string;
};

export type WorkflowApiResponse = {
  request: {
    prompt: string;
  };
  generation: {
    status: "succeeded" | "fallback";
    used_fallback: boolean;
    message: string;
  };
  terraform: {
    generated_code: string;
    formatted_code: string;
  };
  validation: {
    status: "passed" | "failed";
    message: string;
    logs: WorkflowValidationLog[];
    combined_log: string;
  };
  security: {
    status:
      | "passed"
      | "failed"
      | "not_run"
      | "scanner_unavailable"
      | "scan_error";
    message: string;
    findings: WorkflowSecurityFinding[];
    log: WorkflowValidationLog | null;
  };
  readiness: {
    is_ready: boolean;
    status: string;
    message: string;
    deploy_hint: string;
  };
};

export type WorkflowFixMetadata = {
  readinessStatus?: string;
  validationStatus?: WorkflowApiResponse["validation"]["status"] | "";
  securityStatus?: WorkflowApiResponse["security"]["status"] | "";
  securityFindingCount?: number;
};

export type WorkflowDeployResponse = {
  request: {
    prompt: string;
  };
  delivery: {
    status: "succeeded";
    message: string;
    branch_name: string;
    commit_sha: string;
    pull_request_url: string;
    pull_request_number: number;
  };
};

type ErrorPayload = {
  detail?: string;
  message?: string;
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload;
    return payload.message ?? payload.detail ?? "Workflow request failed.";
  } catch {
    return "Workflow request failed.";
  }
}

export async function submitWorkflowRequest(
  prompt: string,
): Promise<WorkflowApiResponse> {
  const normalizedPrompt = prompt.trim();
  if (!normalizedPrompt) {
    throw new Error("A natural-language infrastructure request is required.");
  }

  const response = await fetch("/api/workflow", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt: normalizedPrompt }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as WorkflowApiResponse;
}

export async function submitWorkflowDeployRequest(
  prompt: string,
  terraformCode: string,
): Promise<WorkflowDeployResponse> {
  const normalizedPrompt = prompt.trim();
  const normalizedTerraformCode = terraformCode.trim();

  if (!normalizedPrompt) {
    throw new Error("A natural-language infrastructure request is required.");
  }

  if (!normalizedTerraformCode) {
    throw new Error("Terraform code is required for GitOps delivery.");
  }

  const response = await fetch("/api/deploy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: normalizedPrompt,
      terraform_code: normalizedTerraformCode,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as WorkflowDeployResponse;
}

export async function submitFixRequest(
  prompt: string,
  terraformCode: string,
  validationErrors: string,
  securityFindings: string,
  metadata: WorkflowFixMetadata = {},
): Promise<WorkflowApiResponse> {
  const normalizedPrompt = prompt.trim();
  const normalizedTerraformCode = terraformCode.trim();

  if (!normalizedPrompt) {
    throw new Error("A natural-language infrastructure request is required.");
  }

  const response = await fetch("/api/fix", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: normalizedPrompt,
      terraform_code: normalizedTerraformCode,
      validation_errors: validationErrors,
      security_findings: securityFindings,
      readiness_status: metadata.readinessStatus ?? "",
      validation_status: metadata.validationStatus ?? "",
      security_status: metadata.securityStatus ?? "",
      security_finding_count: metadata.securityFindingCount ?? 0,
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as WorkflowApiResponse;
}
