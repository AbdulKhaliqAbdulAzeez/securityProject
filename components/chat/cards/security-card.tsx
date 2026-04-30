"use client";

import React from "react";
import { WorkflowApiResponse } from "@/lib/workflow-api";

interface SecurityCardProps {
  security: WorkflowApiResponse["security"];
}

export function SecurityCard({ security }: SecurityCardProps) {
  const isPassed = security.status === "passed";
  const findings = security.findings || [];
  const hasFindings = findings.length > 0;
  const isFailed = security.status === "failed";

  return (
    <div
      className={`chat-card ${isPassed ? "chat-card--success" : "chat-card--failure"}`}
    >
      <div className="chat-card-header">
        <span className="chat-card-title">Security Scan</span>
        <div className="chat-card-status-row">
          <span className={`status-pill ${hasFindings ? "status-pill--fail" : "status-pill--neutral"}`}>
            {findings.length} {findings.length === 1 ? "finding" : "findings"}
          </span>
          <span className={`status-pill ${isPassed ? "status-pill--pass" : "status-pill--fail"}`}>
            {isPassed ? "✓ Passed" : isFailed ? "✗ Failed" : security.status.replaceAll("_", " ")}
          </span>
        </div>
      </div>

      <p className="chat-card-summary">{security.message}</p>

      {isPassed && (
        <div className="security-success-row">
          No blocking Checkov findings were reported for this configuration.
        </div>
      )}

      {hasFindings && (
        <div className="security-findings-list">
          {findings.map((finding, i) => (
            <article key={`${finding.check_id}-${i}`} className="security-finding-item">
              <div className="security-finding-title">{finding.check_id}: {finding.check_name}</div>
              <div className="security-finding-meta">
                Resource: <code className="chip">{finding.resource}</code> • {finding.file_path}:{finding.file_line_range}
              </div>
              {finding.guideline && (
                <a 
                  href={finding.guideline} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="security-finding-link"
                >
                  View Guideline →
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      {security.log && (
        <details className="chat-details">
          <summary>View raw scan log</summary>
          <pre className="chat-card-log">
            {`$ ${security.log.command}\n\nexit code: ${security.log.return_code}\n\nstdout:\n${security.log.stdout}\n\nstderr:\n${security.log.stderr}`}
          </pre>
        </details>
      )}
    </div>
  );
}
