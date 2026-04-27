export const defaultInfrastructurePrompt =
  "Create a highly available AWS EC2 web server with an application load balancer and a security group that allows HTTP traffic.";

import type {
  WorkflowApiResponse,
  WorkflowSecurityFinding,
  WorkflowValidationLog,
} from "@/lib/workflow-api";

export type StatusTone = "idle" | "active" | "warning" | "ready";
export type NoticeTone = "info" | "error";

export type WorkflowStep = {
  id: "generation" | "validation" | "security";
  label: string;
  status: string;
  detail: string;
  tone: StatusTone;
};

export type FeedbackSection = {
  id: "generation" | "validation" | "security";
  label: string;
  title: string;
  body: string;
  log?: string;
  items?: string[];
};

export type WorkflowReadiness = {
  label: string;
  title: string;
  summary: string;
  detail: string;
  deployHint: string;
  tone: "idle" | "warning" | "ready";
};

export type WorkflowViewModel = {
  terraform: string;
  steps: WorkflowStep[];
  feedbackSections: FeedbackSection[];
  readiness: WorkflowReadiness;
  isBusy: boolean;
};

export const idleWorkflowViewModel: WorkflowViewModel = {
  terraform:
    "# Generated Terraform output will appear here after the Python workflow API returns a response.",
  steps: [
    {
      id: "generation",
      label: "Generation",
      status: "Waiting for prompt",
      detail:
        "No Terraform request has been staged yet, so the generation step remains idle.",
      tone: "idle",
    },
    {
      id: "validation",
      label: "Terraform validation",
      status: "Waiting on generation",
      detail:
        "The validate-only backend loop begins only after Terraform generation returns code.",
      tone: "idle",
    },
    {
      id: "security",
      label: "Security scan",
      status: "Waiting on validation",
      detail:
        "Checkov findings will appear after Terraform generation succeeds and validation completes.",
      tone: "idle",
    },
  ],
  feedbackSections: [
    {
      id: "generation",
      label: "Generation",
      title: "No backend run staged",
      body:
        "Run the workflow to send the prompt through the Python API bridge and capture generation metadata.",
    },
    {
      id: "validation",
      label: "Validation",
      title: "Validation logs reserved",
      body:
        "Terraform fmt, init, and validate results will appear here after the backend returns command output.",
    },
    {
      id: "security",
      label: "Security",
      title: "Security findings will appear here",
      body:
        "Successful scans, blocking Checkov findings, and local scanner setup failures will be summarized here.",
    },
  ],
  readiness: {
    label: "Not ready",
    title: "Deploy remains intentionally disabled",
    summary: "The shell is waiting on a staged workflow preview.",
    detail:
      "Readiness is shown in the UI early so later backend, security, and GitOps work can plug into an already explicit state model.",
    deployHint:
      "Deploy to GitHub stays disabled until Sprint 4 adds branch creation, commit delivery, and pull-request generation.",
    tone: "idle",
  },
  isBusy: false,
};

function createLogTitle(status: WorkflowApiResponse["validation"]["status"]): string {
  return status === "passed" ? "Validation logs captured" : "Validation errors captured";
}

function createCommandLog(
  log: WorkflowValidationLog | null | undefined,
): string | undefined {
  if (!log) {
    return undefined;
  }

  const stdoutSection = log.stdout ? `stdout:\n${log.stdout}` : "stdout:";
  const stderrSection = log.stderr ? `stderr:\n${log.stderr}` : "stderr:";

  return [
    `$ ${log.command}`,
    `exit code: ${log.return_code}`,
    stdoutSection,
    stderrSection,
  ].join("\n\n");
}

function formatSecurityFinding(finding: WorkflowSecurityFinding): string {
  const location = finding.file_line_range
    ? `${finding.file_path}:${finding.file_line_range}`
    : finding.file_path;
  const resource = finding.resource ? ` Resource: ${finding.resource}.` : "";
  const guideline = finding.guideline ? ` Guidance: ${finding.guideline}` : "";

  return `${finding.check_id}: ${finding.check_name} at ${location}.${resource}${guideline}`;
}

function createSecurityStep(
  security: WorkflowApiResponse["security"],
): Pick<WorkflowStep, "status" | "detail" | "tone"> {
  switch (security.status) {
    case "passed":
      return { status: "Passed", detail: security.message, tone: "ready" };
    case "failed":
      return { status: "Failed", detail: security.message, tone: "warning" };
    case "scanner_unavailable":
      return { status: "Setup required", detail: security.message, tone: "warning" };
    case "scan_error":
      return { status: "Scan error", detail: security.message, tone: "warning" };
    case "not_run":
      return { status: "Not run", detail: security.message, tone: "idle" };
    default:
      return { status: security.status, detail: security.message, tone: "warning" };
  }
}

function createSecurityFeedbackSection(
  security: WorkflowApiResponse["security"],
): FeedbackSection {
  switch (security.status) {
    case "passed":
      return {
        id: "security",
        label: "Security",
        title: "Checkov scan passed",
        body: security.message,
      };
    case "failed": {
      const findingCount = security.findings.length;
      const noun = findingCount === 1 ? "finding" : "findings";

      return {
        id: "security",
        label: "Security",
        title: `Checkov reported ${findingCount} blocking ${noun}`,
        body: security.message,
        items: security.findings.map(formatSecurityFinding),
      };
    }
    case "scanner_unavailable":
      return {
        id: "security",
        label: "Security",
        title: "Checkov setup required",
        body: security.message,
        log: createCommandLog(security.log),
      };
    case "scan_error":
      return {
        id: "security",
        label: "Security",
        title: "Checkov scan failed",
        body: security.message,
        log: createCommandLog(security.log),
      };
    case "not_run":
    default:
      return {
        id: "security",
        label: "Security",
        title: "Security scan did not run",
        body: security.message,
      };
  }
}

function createReadinessState(
  response: WorkflowApiResponse,
): WorkflowReadiness {
  if (response.readiness.is_ready) {
    return {
      label: "Ready",
      title: "Ready for GitOps handoff",
      summary: response.readiness.message,
      detail: response.security.message,
      deployHint: response.readiness.deploy_hint,
      tone: "ready",
    };
  }

  if (response.validation.status === "failed") {
    return {
      label: "Blocked by validation",
      title: "Not ready to deploy",
      summary: response.readiness.message,
      detail:
        "Resolve the Terraform validation failures before the workflow can advance to a security review gate.",
      deployHint: response.readiness.deploy_hint,
      tone: "warning",
    };
  }

  if (response.security.status === "failed") {
    return {
      label: "Blocked by security",
      title: "Not ready to deploy",
      summary: response.readiness.message,
      detail:
        "Resolve the Checkov findings listed below before treating the Terraform as ready for handoff.",
      deployHint: response.readiness.deploy_hint,
      tone: "warning",
    };
  }

  if (response.security.status === "scanner_unavailable") {
    return {
      label: "Blocked by scanner setup",
      title: "Not ready to deploy",
      summary: response.readiness.message,
      detail: response.security.message,
      deployHint: response.readiness.deploy_hint,
      tone: "warning",
    };
  }

  if (response.security.status === "scan_error") {
    return {
      label: "Blocked by scan failure",
      title: "Not ready to deploy",
      summary: response.readiness.message,
      detail: response.security.message,
      deployHint: response.readiness.deploy_hint,
      tone: "warning",
    };
  }

  return {
    label: "Pending security review",
    title: "Validation passed, security still pending",
    summary: response.readiness.message,
    detail: response.security.message,
    deployHint: response.readiness.deploy_hint,
    tone: "warning",
  };
}

export function createRunningWorkflowViewModel(prompt: string): WorkflowViewModel {
  return {
    terraform: `# Waiting for backend response\n# Request: ${prompt.trim() || defaultInfrastructurePrompt}`,
    steps: [
      {
        id: "generation",
        label: "Generation",
        status: "Running",
        detail: "Submitting the natural-language request to the Python API bridge.",
        tone: "active",
      },
      {
        id: "validation",
        label: "Terraform validation",
        status: "Waiting on generation",
        detail:
          "Terraform fmt, init, and validate will run after generation returns code.",
        tone: "idle",
      },
      {
        id: "security",
        label: "Security scan",
        status: "Waiting on validation",
        detail: "Checkov will run after Terraform validation succeeds.",
        tone: "idle",
      },
    ],
    feedbackSections: [
      {
        id: "generation",
        label: "Generation",
        title: "Sending prompt to backend",
        body:
          "The prompt is in flight to the Python API bridge for Terraform generation.",
      },
      {
        id: "validation",
        label: "Validation",
        title: "Validation pending",
        body:
          "Validation logs will populate here after generation completes and the Terraform CLI finishes.",
      },
      {
        id: "security",
        label: "Security",
        title: "Security scan pending",
        body:
          "The backend will run Checkov after generation and Terraform validation complete.",
      },
    ],
    readiness: {
      label: "Working",
      title: "Workflow running",
      summary: "Waiting for the backend to return generation and validation results.",
      detail:
        "Deploy readiness remains disabled while the Python workflow request is still running.",
      deployHint:
        "Deploy stays disabled until Sprint 3 adds security scanning and Sprint 4 adds GitOps delivery.",
      tone: "idle",
    },
    isBusy: true,
  };
}

export function createWorkflowViewModelFromResponse(
  response: WorkflowApiResponse,
): WorkflowViewModel {
  const generationTone = response.generation.used_fallback ? "warning" : "ready";
  const generationStatus = response.generation.used_fallback ? "Fallback used" : "Complete";
  const validationTone = response.validation.status === "passed" ? "ready" : "warning";
  const validationStatus = response.validation.status === "passed" ? "Passed" : "Failed";
  const securityStep = createSecurityStep(response.security);

  return {
    terraform:
      response.terraform.formatted_code || response.terraform.generated_code || idleWorkflowViewModel.terraform,
    steps: [
      {
        id: "generation",
        label: "Generation",
        status: generationStatus,
        detail: response.generation.message,
        tone: generationTone,
      },
      {
        id: "validation",
        label: "Terraform validation",
        status: validationStatus,
        detail: response.validation.message,
        tone: validationTone,
      },
      {
        id: "security",
        label: "Security scan",
        status: securityStep.status,
        detail: securityStep.detail,
        tone: securityStep.tone,
      },
    ],
    feedbackSections: [
      {
        id: "generation",
        label: "Generation",
        title: response.generation.used_fallback ? "Fallback Terraform returned" : "Terraform generated",
        body: response.generation.message,
      },
      {
        id: "validation",
        label: "Validation",
        title: createLogTitle(response.validation.status),
        body: response.validation.message,
        log: response.validation.combined_log,
      },
      createSecurityFeedbackSection(response.security),
    ],
    readiness: createReadinessState(response),
    isBusy: false,
  };
}

export function createWorkflowFailureViewModel(
  prompt: string,
  message: string,
): WorkflowViewModel {
  const normalizedPrompt = prompt.trim();

  return {
    terraform: normalizedPrompt
      ? `# Terraform output unavailable because the backend request failed.\n# Request: ${normalizedPrompt}`
      : idleWorkflowViewModel.terraform,
    steps: [
      {
        id: "generation",
        label: "Generation",
        status: "Failed",
        detail: message,
        tone: "warning",
      },
      {
        id: "validation",
        label: "Terraform validation",
        status: "Not run",
        detail: "Validation did not start because the backend request did not complete.",
        tone: "idle",
      },
      {
        id: "security",
        label: "Security scan",
        status: "Not run",
        detail:
          "Security scanning did not start because the backend request failed before validation completed.",
        tone: "idle",
      },
    ],
    feedbackSections: [
      {
        id: "generation",
        label: "Generation",
        title: "Backend request failed",
        body: message,
      },
      {
        id: "validation",
        label: "Validation",
        title: "Validation did not run",
        body: "No Terraform validation logs are available because the workflow did not reach the validation stage.",
      },
      {
        id: "security",
        label: "Security",
        title: "Security scan did not run",
        body:
          "Checkov could not start because the backend request failed before Terraform validation completed.",
      },
    ],
    readiness: {
      label: "Blocked by backend error",
      title: "Not ready to deploy",
      summary: message,
      detail: "Fix the backend request failure before generation and validation can resume.",
      deployHint:
        "Deploy to GitHub remains disabled until the backend is reachable, security scanning is wired, and GitOps delivery exists.",
      tone: "warning",
    },
    isBusy: false,
  };
}