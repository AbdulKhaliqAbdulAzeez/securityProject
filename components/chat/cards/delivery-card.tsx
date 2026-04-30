"use client";

import React from "react";
import { WorkflowDeployResponse } from "@/lib/workflow-api";

interface DeliveryCardProps {
  delivery: WorkflowDeployResponse["delivery"];
}

export function DeliveryCard({ delivery }: DeliveryCardProps) {
  return (
    <div className="chat-card chat-card--success delivery-success-glow">
      <div className="chat-card-header">
        <span className="chat-card-title">GitOps Delivery</span>
        <span className="status-pill status-pill--pass">Succeeded</span>
      </div>

      <h3 className="delivery-card-title">
        Pull Request Created
      </h3>

      <div className="delivery-card-meta-grid">
        <div className="delivery-card-meta-item">
          <span className="chat-meta">Branch</span>
          <code className="chip">{delivery.branch_name}</code>
        </div>
        <div className="delivery-card-meta-item">
          <span className="chat-meta">Commit</span>
          <code className="chip">{delivery.commit_sha.substring(0, 8)}</code>
        </div>
      </div>

      <a
        href={delivery.pull_request_url}
        target="_blank"
        rel="noopener noreferrer"
        className="button button--primary delivery-card-link"
        aria-label={`View Pull Request #${delivery.pull_request_number}`}
      >
        View Pull Request #{delivery.pull_request_number} →
      </a>

      <p className="delivery-card-message">
        {delivery.message}
      </p>
    </div>
  );
}
