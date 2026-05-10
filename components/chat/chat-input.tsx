"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  suggestions?: string[];
}

export interface ChatInputHandle {
  focus: () => void;
  fill: (value: string) => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
function ChatInput({ onSend, disabled, suggestions = [] }, ref) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    },
    fill: (value: string) => {
      setText(value);
      window.requestAnimationFrame(() => textareaRef.current?.focus());
    },
  }));

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        144 // approx 6 rows
      )}px`;
    }
  }, [text]);

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setText(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="chat-input-bar">
      {suggestions.length > 0 && (
        <div className="chat-suggestions" aria-label="Suggested prompts">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="scenario-pill"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={disabled}
              aria-label={`Use suggested prompt: ${suggestion}`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <div className="chat-input-container">
        <textarea
          ref={textareaRef}
          className="chat-input-textarea"
          placeholder="Describe the infrastructure you need, or ask a question..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <button
          className="button button--primary chat-send-button"
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          aria-label="Send message"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 19V5"></path>
            <path d="m5 12 7-7 7 7"></path>
          </svg>
        </button>
      </div>
    </div>
  );
});
