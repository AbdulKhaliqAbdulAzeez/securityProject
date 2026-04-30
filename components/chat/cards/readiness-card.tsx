"use client";

import React from "react";
import { WorkflowApiResponse } from "@/lib/workflow-api";

interface ReadinessCardProps {
  readiness: WorkflowApiResponse["readiness"];
  onAction: (action: string) => void;
}

export function ReadinessCard({ readiness, onAction }: ReadinessCardProps) {
  const isReady = readiness.is_ready;
  const blockedGate = getBlockedGate(readiness.status, readiness.message);

  return (
    <div
      className={`chat-card ${isReady ? "chat-card--success" : "chat-card--failure"}`}
    >
      <div className="chat-card-header">
        <span className="chat-card-title">Handoff Readiness</span>
        <span className={`status-pill ${isReady ? "status-pill--pass" : "status-pill--fail"}`}>
          {isReady ? "Ready" : "Blocked"}
        </span>
      </div>
      
      <h3 className="readiness-card-title">
        {isReady ? "Ready for GitOps" : "Blocked"}
      </h3>
      <p className="chat-card-summary">
        {readiness.message}
      </p>

      {!isReady && (
        <div className="readiness-gate">
          <span className="readiness-gate-label">{blockedGate.label}</span>
          <span className="readiness-gate-copy">{blockedGate.copy}</span>
        </div>
      )}

      <div className="readiness-action-row">
        {isReady ? (
          <button
            className="button button--primary"
            onClick={() => onAction("deploy")}
            aria-label="Deploy to GitHub"
          >
            Deploy to GitHub →
          </button>
        ) : (
          <button
            className="button button--danger"
            onClick={() => onAction("fix")}
            aria-label="Auto-Fix Issues"
          >
            Auto-Fix Issues
          </button>
        )}
      </div>

      {readiness.deploy_hint && (
        <p className="readiness-hint">
          {readiness.deploy_hint}
        </p>
      )}
    </div>
  );
}

function getBlockedGate(status: string, message: string) {
  const searchable = `${status} ${message}`.toLowerCase();

  if (searchable.includes("security") || searchable.includes("checkov")) {
    return {
      label: "Security gate failed",
      copy: "Checkov reported findings that must be fixed before GitOps delivery.",
    };
  }

  if (searchable.includes("validat") || searchable.includes("terraform")) {
    return {
      label: "Validation gate failed",
      copy: "Terraform validation did not pass, so the generated code needs correction.",
    };
  }

  return {
    label: "Readiness gate failed",
    copy: "One or more workflow checks are blocking delivery.",
  };
}
