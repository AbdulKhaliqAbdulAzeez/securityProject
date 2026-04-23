export const defaultInfrastructurePrompt =
  "Create a highly available AWS EC2 web server with an application load balancer and a security group that allows HTTP traffic.";

import type { WorkflowApiResponse } from "@/lib/workflow-api";

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
      status: "Queued for Sprint 3",
      detail:
        "The shell already reserves a blocking scan region even though Checkov is not wired yet.",
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
      title: "Security feedback reserved",
      body:
        "The Checkov gate is intentionally visible before implementation so readiness rules are not hidden in a later sprint.",
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
        status: "Queued for Sprint 3",
        detail:
          "Security scanning remains visible in the UI even though the backend contract is not wired yet.",
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
        title: "Security gate remains queued",
        body:
          "The workflow still reserves a security gate before any deploy action becomes available.",
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
        status: "Queued for Sprint 3",
        detail: response.security.message,
        tone: "idle",
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
      {
        id: "security",
        label: "Security",
        title: "Security gate still pending",
        body: response.security.message,
      },
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
        status: "Queued for Sprint 3",
        detail:
          "Security scanning remains unavailable until Sprint 3 wires the Checkov gate.",
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
        title: "Security gate still pending",
        body:
          "The deploy gate remains blocked until the backend succeeds and the later security sprint is implemented.",
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