"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChatAction,
  ChatState,
  initialChatState,
  createUserMessage,
} from "@/lib/chat-state";
import { AgentContext, runAgent } from "@/lib/chat-agent";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";

const initialContext: AgentContext = {
  terraformCode: "",
  validationErrors: "",
  securityFindings: "",
  isReady: false,
  prompt: "",
  readinessStatus: "",
  validationStatus: "",
  securityStatus: "",
  securityFindingCount: 0,
};

export function ChatShell() {
  const [state, setState] = useState<ChatState>(initialChatState);
  const [context, setContext] = useState<AgentContext>(initialContext);
  const [toast, setToast] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [state.messages]);

  const suggestions = [
    "Create an S3 bucket",
    "Set up a VPC with subnets",
    "Provision an EC2 instance",
  ];

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const handleSend = async (
    text: string,
    options: { visibleText?: string } = {}
  ) => {
    if (state.isBusy) {
      return;
    }

    const userMsg = createUserMessage(options.visibleText ?? text);
    setState((prev) => {
      const thinkingMsg = {
        id: `thinking-${Date.now()}`,
        role: "assistant" as const,
        cardType: "thinking" as const,
        timestamp: Date.now(),
      };
      return {
        ...prev,
        messages: [...prev.messages, userMsg, thinkingMsg],
        isBusy: true,
      };
    });

    const result = await runAgent(text, context);
    const errorMessage = result.messages.find(
      (message) => message.cardType === "error"
    )?.text;

    if (errorMessage) {
      setToast(errorMessage);
    }

    if (result.reset) {
      setState({
        ...initialChatState,
        isBusy: false,
      });
      setContext(initialContext);
    } else {
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages.filter((message) => message.cardType !== "thinking"),
          ...result.messages,
        ],
        isBusy: false,
      }));
      setContext((prev) => ({
        ...prev,
        ...result.nextContext,
      }));
    }
  };

  const handleAction = (action: ChatAction) => {
    if (action.type === "fix") {
      void handleSend("fix", { visibleText: action.visibleText });
      return;
    }

    void handleSend("deploy", {
      visibleText: action.visibleText ?? "Deploy to GitHub",
    });
  };

  return (
    <div className={`chat-frame ${state.messages.length === 1 ? "chat-frame--empty" : ""}`}>
      {toast && (
        <div className="chat-toast" role="status" aria-live="polite">
          <span className="chat-toast__title">Workflow issue</span>
          <span>{toast}</span>
        </div>
      )}
      <div className="chat-thread" ref={threadRef}>
        {state.messages.map((msg, index) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            onAction={handleAction}
            index={index}
          />
        ))}
      </div>
      <ChatInput
        onSend={handleSend}
        disabled={state.isBusy}
        suggestions={state.messages.length === 1 ? suggestions : []}
      />
    </div>
  );
}
