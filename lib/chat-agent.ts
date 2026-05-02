import { ChatMessage, createAssistantMessage } from "./chat-state";
import {
  WorkflowSecurityFinding,
  WorkflowDeployResponse,
  WorkflowApiResponse,
  submitFixRequest,
  submitWorkflowDeployRequest,
  submitWorkflowRequest,
} from "./workflow-api";

export type AgentContext = {
  terraformCode: string;
  validationErrors: string;
  securityFindings: string;
  isReady: boolean;
  prompt: string;
  readinessStatus: string;
  validationStatus: WorkflowApiResponse["validation"]["status"] | "";
  securityStatus: WorkflowApiResponse["security"]["status"] | "";
  securityFindingCount: number;
};

export type AgentResult = {
  messages: ChatMessage[];
  nextContext: Partial<AgentContext>;
  reset?: boolean;
};

export type Intent = "GENERATE" | "FIX" | "DEPLOY" | "RESET" | "EXPLAIN";

export function detectIntent(text: string, context: AgentContext): Intent {
  const normalizedText = text.toLowerCase().trim();

  if (/\b(reset|start over|clear|new request)\b/i.test(normalizedText)) {
    return "RESET";
  }

  if (/\b(deploy|push|ship|send to github|submit)\b/i.test(normalizedText)) {
    return "DEPLOY";
  }

  if (
    context.terraformCode &&
    !context.isReady &&
    /\b(fix|auto.?fix|resolve|correct|yes)\b/i.test(normalizedText)
  ) {
    return "FIX";
  }

  if (!context.terraformCode || describesInfrastructure(normalizedText)) {
    return "GENERATE";
  }

  return "EXPLAIN";
}

function describesInfrastructure(text: string): boolean {
  return (
    text.split(/\s+/).length > 3 ||
    /\b(create|generate|build|provision|set up|setup|configure|need|want|bucket|vpc|subnet|ec2|rds|lambda|iam|s3|cloudfront|load balancer)\b/i.test(
      text
    )
  );
}

function workflowResponseToMessages(
  response: WorkflowApiResponse,
  prompt: string
): ChatMessage[] {
  const terraformCode =
    response.terraform.formatted_code || response.terraform.generated_code;

  return [
    createAssistantMessage("text", {
      text:
        response.generation.message ||
        `I've generated Terraform for "${prompt}".`,
    }),
    createAssistantMessage("code", {
      terraform: terraformCode,
    }),
    createAssistantMessage("validation", {
      validation: response.validation,
    }),
    createAssistantMessage("security", {
      security: response.security,
    }),
    createAssistantMessage("readiness", {
      readiness: response.readiness,
    }),
  ];
}

function deliveryResponseToMessage(response: WorkflowDeployResponse): ChatMessage {
  return createAssistantMessage("delivery", {
    delivery: response.delivery,
  });
}

function formatSecurityFindingsForFix(
  message: string,
  findings: WorkflowSecurityFinding[]
): string {
  const normalizedMessage = message.trim();

  if (findings.length === 0) {
    return normalizedMessage;
  }

  const formattedFindings = findings
    .map((finding, index) => {
      const details = [
        `Finding ${index + 1}`,
        `Check: ${finding.check_id} - ${finding.check_name}`,
        `Resource: ${finding.resource}`,
        `Location: ${finding.file_path}:${finding.file_line_range}`,
        finding.guideline ? `Guideline: ${finding.guideline}` : "",
      ].filter(Boolean);

      return details.join("\n");
    })
    .join("\n\n");

  return [normalizedMessage, formattedFindings].filter(Boolean).join("\n\n");
}

function responseToContext(
  response: WorkflowApiResponse,
  prompt?: string
): Partial<AgentContext> {
  return {
    terraformCode:
      response.terraform.formatted_code || response.terraform.generated_code,
    validationErrors:
      response.validation.status === "failed"
        ? response.validation.combined_log
        : "",
    securityFindings:
      response.security.status === "failed"
        ? formatSecurityFindingsForFix(
            response.security.message,
            response.security.findings
          )
        : "",
    isReady: response.readiness.is_ready,
    readinessStatus: response.readiness.status,
    validationStatus: response.validation.status,
    securityStatus: response.security.status,
    securityFindingCount: response.security.findings.length,
    ...(prompt === undefined ? {} : { prompt }),
  };
}

function buildFixPreamble(context: AgentContext): string {
  if (context.validationStatus === "failed") {
    return "I'm repairing the Terraform validation errors and will re-run validation and security scanning.";
  }

  if (context.securityStatus === "failed" || context.securityFindingCount > 0) {
    return "I'm repairing the Checkov security findings and will re-run the workflow checks.";
  }

  return "I'm repairing the blocked workflow checks and will re-run validation and security scanning.";
}

export async function runAgent(
  text: string,
  context: AgentContext
): Promise<AgentResult> {
  const intent = detectIntent(text, context);

  try {
    switch (intent) {
      case "GENERATE": {
        const response = await submitWorkflowRequest(text);
        return {
          messages: workflowResponseToMessages(response, text),
          nextContext: responseToContext(response, text),
        };
      }

      case "FIX": {
        const response = await submitFixRequest(
          context.prompt,
          context.terraformCode,
          context.validationErrors,
          context.securityFindings,
          {
            readinessStatus: context.readinessStatus,
            validationStatus: context.validationStatus,
            securityStatus: context.securityStatus,
            securityFindingCount: context.securityFindingCount,
          }
        );
        return {
          messages: [
            createAssistantMessage("text", {
              text: buildFixPreamble(context),
            }),
            ...workflowResponseToMessages(response, context.prompt),
          ],
          nextContext: responseToContext(response),
        };
      }

      case "DEPLOY": {
        if (!context.isReady) {
          return {
            messages: [
              createAssistantMessage("text", {
                text: "I can't deploy yet because the current configuration isn't ready. Please resolve the validation or security issues first.",
              }),
            ],
            nextContext: {},
          };
        }
        const response = await submitWorkflowDeployRequest(context.prompt, context.terraformCode);
        return {
          messages: [deliveryResponseToMessage(response)],
          nextContext: {},
        };
      }

      case "RESET": {
        return {
          messages: [
            createAssistantMessage("text", {
              text: "Thread reset. How can I help with a new infrastructure request?",
            }),
          ],
          nextContext: {
            terraformCode: "",
            validationErrors: "",
            securityFindings: "",
            isReady: false,
            prompt: "",
            readinessStatus: "",
            validationStatus: "",
            securityStatus: "",
            securityFindingCount: 0,
          },
          reset: true,
        };
      }

      case "EXPLAIN":
      default: {
        return {
          messages: [
            createAssistantMessage("text", {
              text: "I can generate Terraform from a new infrastructure request, fix blocked validation or security issues, deploy ready code to GitHub, or reset the thread for a fresh request.",
            }),
          ],
          nextContext: {},
        };
      }
    }
  } catch (error) {
    return {
      messages: [
        createAssistantMessage("error", {
          text: error instanceof Error ? error.message : "An unexpected error occurred while processing your request.",
        }),
      ],
      nextContext: {},
    };
  }
}
