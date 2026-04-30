import { ChatMessage, createAssistantMessage } from "./chat-state";
import {
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
      response.security.status === "failed" ? response.security.message : "",
    isReady: response.readiness.is_ready,
    ...(prompt === undefined ? {} : { prompt }),
  };
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
          context.securityFindings
        );
        return {
          messages: [
            createAssistantMessage("text", {
              text: "Analysing the issues and regenerating...",
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
