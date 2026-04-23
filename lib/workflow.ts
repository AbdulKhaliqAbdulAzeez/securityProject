export const defaultInfrastructurePrompt =
  "Create a highly available AWS EC2 web server with an application load balancer and a security group that allows HTTP traffic.";

export type StatusTone = "idle" | "active" | "warning" | "ready";
export type NoticeTone = "info" | "error";
export type WorkflowScenarioId = "blocked" | "ready";

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
};

export type WorkflowReadiness = {
  label: string;
  title: string;
  summary: string;
  detail: string;
  deployHint: string;
  tone: "idle" | "warning" | "ready";
};

export type WorkflowPreview = {
  terraform: string;
  steps: WorkflowStep[];
  feedbackSections: FeedbackSection[];
  readiness: WorkflowReadiness;
};

export const scenarioOptions: Array<{
  id: WorkflowScenarioId;
  label: string;
  description: string;
}> = [
  {
    id: "blocked",
    label: "Security gate preview",
    description:
      "Models a run where Terraform generation and validation are visible, but security review still blocks readiness.",
  },
  {
    id: "ready",
    label: "Ready-state preview",
    description:
      "Models the future frontend state after generation, validation, and security review all pass, while GitOps remains disabled.",
  },
];

export const emptyWorkflowPreview: WorkflowPreview = {
  terraform:
    "# Generated Terraform preview will appear here once the workflow is staged.\n# The live backend response will replace this placeholder in Sprint 2.",
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
        "Stage the workflow shell to preview how generation contract notes will be presented in the new frontend.",
    },
    {
      id: "validation",
      label: "Validation",
      title: "Validation logs reserved",
      body:
        "This panel replaces the old generic output area so Terraform-specific feedback has a dedicated home.",
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
};

function buildTerraformPreview(prompt: string, scenario: WorkflowScenarioId): string {
  const normalizedPrompt = prompt.trim();
  const reviewTag = scenario === "ready" ? "ready-preview" : "security-review-preview";

  return [
    "# Frontend workflow shell preview",
    `# Request: ${normalizedPrompt}`,
    "terraform {",
    '  required_version = ">= 1.6.0"',
    "",
    "  required_providers {",
    "    aws = {",
    '      source  = "hashicorp/aws"',
    '      version = "~> 5.0"',
    "    }",
    "  }",
    "}",
    "",
    'provider "aws" {',
    '  region = "us-east-1"',
    "}",
    "",
    'resource "aws_security_group" "web" {',
    `  name        = "${reviewTag}"`,
    '  description = "Workflow shell preview security group"',
    "",
    "  ingress {",
    '    description = "Allow HTTP"',
    '    from_port   = 80',
    '    to_port     = 80',
    '    protocol    = "tcp"',
    '    cidr_blocks = ["0.0.0.0/0"]',
    "  }",
    "}",
  ].join("\n");
}

export function createWorkflowPreview(
  prompt: string,
  scenario: WorkflowScenarioId,
): WorkflowPreview {
  const normalizedPrompt = prompt.trim() || defaultInfrastructurePrompt;

  if (scenario === "ready") {
    return {
      terraform: buildTerraformPreview(normalizedPrompt, scenario),
      steps: [
        {
          id: "generation",
          label: "Generation",
          status: "Complete",
          detail:
            "The shell now shows where cleaned Terraform output returns after the Gemini-backed generation step.",
          tone: "ready",
        },
        {
          id: "validation",
          label: "Terraform validation",
          status: "Passed",
          detail:
            "The future backend bridge will stream fmt, init, and validate results into this dedicated workflow region.",
          tone: "ready",
        },
        {
          id: "security",
          label: "Security scan",
          status: "Passed",
          detail:
            "The UI can already represent a fully reviewed state before Checkov is wired in Sprint 3.",
          tone: "ready",
        },
      ],
      feedbackSections: [
        {
          id: "generation",
          label: "Generation",
          title: "Prompt contract staged",
          body:
            `The shell is ready to send the request \"${normalizedPrompt}\" through the future Python API without reintroducing Streamlit-specific UI assumptions.`,
        },
        {
          id: "validation",
          label: "Validation",
          title: "Validation surface reserved",
          body:
            "Terraform-specific feedback will remain separate from code output so operators can scan command results without losing the generated HCL view.",
        },
        {
          id: "security",
          label: "Security",
          title: "Ready-state modeled early",
          body:
            "This preview shows the future all-clear state while keeping the actual deploy control disabled until GitOps arrives.",
        },
      ],
      readiness: {
        label: "Ready state visible",
        title: "Ready for GitOps handoff",
        summary:
          "Generation, validation, and security review all read as green in this shell preview.",
        detail:
          "The frontend now exposes the future ready-to-deploy state explicitly, even though GitHub delivery is still a later sprint.",
        deployHint:
          "GitOps delivery is intentionally disabled today. Sprint 4 will connect this ready state to branch creation and pull-request output.",
        tone: "ready",
      },
    };
  }

  return {
    terraform: buildTerraformPreview(normalizedPrompt, scenario),
    steps: [
      {
        id: "generation",
        label: "Generation",
        status: "Complete",
        detail:
          "The shell mirrors the cleaned Terraform handoff from the existing backend generation module.",
        tone: "ready",
      },
      {
        id: "validation",
        label: "Terraform validation",
        status: "Passed",
        detail:
          "The UI now reserves a distinct validation region instead of merging Terraform logs into one generic output block.",
        tone: "ready",
      },
      {
        id: "security",
        label: "Security scan",
        status: "Blocked",
        detail:
          "The future Checkov gate already has a visible state boundary so it can block readiness as soon as Sprint 3 lands.",
        tone: "warning",
      },
    ],
    feedbackSections: [
      {
        id: "generation",
        label: "Generation",
        title: "Terraform staged for review",
        body:
          `The prompt \"${normalizedPrompt}\" now flows through a frontend shell that preserves the existing backend contract while replacing the Streamlit surface.`,
      },
      {
        id: "validation",
        label: "Validation",
        title: "Validation results remain readable",
        body:
          "When the Python API lands, fmt, init, and validate logs will stream into this panel without displacing the Terraform code view.",
      },
      {
        id: "security",
        label: "Security",
        title: "Blocking findings modeled",
        body:
          "This preview keeps deployment blocked to demonstrate the future Checkov gate and make readiness rules visible before backend integration exists.",
      },
    ],
    readiness: {
      label: "Blocked by security review",
      title: "Not ready to deploy",
      summary:
        "The shell can already show a blocked readiness path before the security scanner is implemented.",
      detail:
        "Deploy readiness must stay false until both Terraform validation and security scanning succeed, so the UI models that rule early.",
      deployHint:
        "The deploy control stays disabled until Sprint 3 wires the security gate and Sprint 4 adds GitHub delivery.",
      tone: "warning",
    },
  };
}