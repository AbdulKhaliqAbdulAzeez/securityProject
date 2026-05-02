"use client";

import React, { useState } from "react";

interface CodeCardProps {
  code: string;
}

export function CodeCard({ code }: CodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "main.tf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = code.replace(/\n$/, "").split("\n");

  return (
    <div className="chat-card chat-card--code">
      <div className="chat-card-header">
        <span className="chat-card-title">Generated Terraform</span>
        <div className="chat-card-actions">
          <button
            className="button button--secondary chat-card-action-button"
            onClick={handleCopy}
            aria-label={copied ? "Copied generated Terraform" : "Copy generated Terraform"}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            className="button button--secondary chat-card-action-button"
            onClick={handleDownload}
            aria-label="Download generated Terraform as main.tf"
          >
            Download
          </button>
        </div>
      </div>
      <pre className="chat-card-code-pre">
        {lines.map((line, i) => (
          <span key={i} className="chat-card-code-line">
            {line || " "}
          </span>
        ))}
      </pre>
    </div>
  );
}
