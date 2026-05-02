"use client";

import React from "react";
import { WorkflowApiResponse } from "@/lib/workflow-api";

interface ValidationCardProps {
  validation: WorkflowApiResponse["validation"];
}

export function ValidationCard({ validation }: ValidationCardProps) {
  const isPassed = validation.status === "passed";

  return (
    <div
      className={`chat-card ${isPassed ? "chat-card--success" : "chat-card--failure"}`}
    >
      <div className="chat-card-header">
        <span className="chat-card-title">Terraform Validation</span>
        <span className={`status-pill ${isPassed ? "status-pill--pass" : "status-pill--fail"}`}>
          {isPassed ? "✓ Passed" : "✗ Failed"}
        </span>
      </div>
      <p className="chat-card-summary">{validation.message}</p>

      {validation.combined_log && (
        <details className="chat-details">
          <summary>View raw logs</summary>
          <pre className="chat-card-log">
            {validation.combined_log}
          </pre>
        </details>
      )}
    </div>
  );
}
