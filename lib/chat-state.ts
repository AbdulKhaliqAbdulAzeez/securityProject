import { WorkflowApiResponse, WorkflowDeployResponse } from "./workflow-api";

export type ChatMessageRole = "user" | "assistant";

export type ChatCardType =
  | "text"
  | "thinking"
  | "code"
  | "validation"
  | "security"
  | "readiness"
  | "delivery"
  | "error";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  cardType: ChatCardType;
  text?: string;
  terraform?: string;
  validation?: WorkflowApiResponse["validation"];
  security?: WorkflowApiResponse["security"];
  readiness?: WorkflowApiResponse["readiness"];
  delivery?: WorkflowDeployResponse["delivery"];
  timestamp: number;
};

export type ChatState = {
  messages: ChatMessage[];
  terraformCode: string;
  readiness: WorkflowApiResponse["readiness"] | null;
  isBusy: boolean;
};

export const initialChatState: ChatState = {
  messages: [
    {
      id: "welcome",
      role: "assistant",
      cardType: "text",
      text: "Hello! Describe the AWS infrastructure you'd like me to architect and I'll generate, validate, and secure the Terraform configuration for you.",
      timestamp: Date.now(),
    },
  ],
  terraformCode: "",
  readiness: null,
  isBusy: false,
};

export function createUserMessage(text: string): ChatMessage {
  return {
    id: Math.random().toString(36).substring(2, 15),
    role: "user",
    cardType: "text",
    text,
    timestamp: Date.now(),
  };
}

export function createAssistantMessage(
  cardType: ChatCardType,
  payload: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    id: Math.random().toString(36).substring(2, 15),
    role: "assistant",
    cardType,
    timestamp: Date.now(),
    ...payload,
  };
}
