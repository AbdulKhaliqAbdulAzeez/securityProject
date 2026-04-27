import * as React from "react";
import { type WorkflowStep } from "@/lib/workflow";

type ProgressRailProps = {
  steps: WorkflowStep[];
  deploymentStatus?: "running" | "succeeded" | "failed" | null;
};

export function WorkflowProgressRail({ steps, deploymentStatus }: ProgressRailProps) {
  const getStepClass = (status: string) => {
    switch (status) {
      case "succeeded":
      case "ready":
      case "passed":
        return "progress-step--success";
      case "running":
        return "progress-step--active";
      case "failed":
      case "blocked_by_security":
      case "blocked_by_validation":
      case "blocked_by_security_setup":
      case "scanner_unavailable":
      case "fallback":
        return "progress-step--error";
      default:
        return "";
    }
  };

  const allWorkflowComplete = steps.every(
    (s) => s.status === "succeeded" || s.status === "passed" || s.status === "fallback",
  ) && steps.length > 0;

  return (
    <div className="progress-rail" aria-label="Workflow progress">
      {steps.map((step) => (
        <React.Fragment key={step.id}>
          <div className={`progress-step ${getStepClass(step.status)}`}>
            <span>{step.label}</span>
          </div>
          <div className="progress-separator" />
        </React.Fragment>
      ))}
      
      {/* Delivery Step */}
      <div
        className={`progress-step ${
          deploymentStatus === "succeeded"
            ? "progress-step--success"
            : deploymentStatus === "running"
            ? "progress-step--active"
            : deploymentStatus === "failed"
            ? "progress-step--error"
            : allWorkflowComplete
            ? "progress-step--active"
            : ""
        }`}
      >
        <span>Delivery</span>
      </div>
    </div>
  );
}
