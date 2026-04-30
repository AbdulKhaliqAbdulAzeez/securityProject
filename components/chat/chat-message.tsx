"use client";

import React from "react";
import { ChatMessage as ChatMessageType } from "@/lib/chat-state";
import { CodeCard } from "./cards/code-card";
import { ValidationCard } from "./cards/validation-card";
import { SecurityCard } from "./cards/security-card";
import { ReadinessCard } from "./cards/readiness-card";
import { DeliveryCard } from "./cards/delivery-card";

interface ChatMessageProps {
  message: ChatMessageType;
  onAction?: (action: string) => void;
  index?: number;
}

export function ChatMessage({ message, onAction, index = 0 }: ChatMessageProps) {
  const isUser = message.role === "user";
  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const animationStyle = {
    animation: 'slideUpFade 0.4s ease-out both',
    animationDelay: `${(index % 8) * 80}ms`,
  };

  const renderContent = () => {
    switch (message.cardType) {
      case "text":
        return <p>{message.text}</p>;
      case "thinking":
        return (
          <div className="chat-thinking">
            <div className="chat-thinking-dot"></div>
            <div className="chat-thinking-dot"></div>
            <div className="chat-thinking-dot"></div>
          </div>
        );
      case "code":
        return <CodeCard code={message.terraform || ""} />;
      case "validation":
        return message.validation ? <ValidationCard validation={message.validation} /> : null;
      case "security":
        return message.security ? <SecurityCard security={message.security} /> : null;
      case "readiness":
        return message.readiness ? <ReadinessCard readiness={message.readiness} onAction={onAction || (() => {})} /> : null;
      case "delivery":
        return message.delivery ? <DeliveryCard delivery={message.delivery} /> : null;
      case "error":
        return (
          <div className={`chat-card chat-card--failure`}>
            <div className="chat-card-header">
              <span className="chat-card-title">System Error</span>
              <span className="status-pill status-pill--fail">Error</span>
            </div>
            <p style={{ color: 'var(--warning)', fontSize: '0.95rem' }}>{message.text}</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (message.cardType !== "text" && message.cardType !== "thinking" && !isUser) {
     return (
        <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'flex-start', width: '100%', maxWidth: '85%', ...animationStyle }}>
            <span className="chat-meta">Assistant • {timestamp}</span>
            {renderContent()}
        </div>
     )
  }

  return (
    <div className={`chat-bubble ${isUser ? "chat-bubble--user" : "chat-bubble--assistant"}`} style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', ...animationStyle }}>
      <span className="chat-meta">
        {isUser ? "You" : "Assistant"} • {timestamp}
      </span>
      {renderContent()}
    </div>
  );
}
