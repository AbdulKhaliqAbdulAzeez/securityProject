"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { WorkflowStatusList } from "@/components/workflow/workflow-status-list";
import {
  createRunningWorkflowViewModel,
  createWorkflowFailureViewModel,
  createWorkflowViewModelFromResponse,
  defaultInfrastructurePrompt,
  idleWorkflowViewModel,
  type NoticeTone,
  type WorkflowViewModel,
} from "@/lib/workflow";
import { submitWorkflowRequest } from "@/lib/workflow-api";

type WorkflowNotice = {
  message: string;
  tone: NoticeTone;
};

export function WorkflowShell() {
  const [prompt, setPrompt] = useState("");
  const [workflow, setWorkflow] = useState<WorkflowViewModel>(idleWorkflowViewModel);
  const [notice, setNotice] = useState<WorkflowNotice | null>(null);

  async function handleRunWorkflow() {
    if (!prompt.trim()) {
      setNotice({
        message:
          "Enter an infrastructure request before running the workflow.",
        tone: "error",
      });
      setWorkflow(idleWorkflowViewModel);
      return;
    }

    setWorkflow(createRunningWorkflowViewModel(prompt));
    setNotice({ message: "Submitting the prompt to the Python backend.", tone: "info" });

    try {
      const response = await submitWorkflowRequest(prompt);
      setWorkflow(createWorkflowViewModelFromResponse(response));
      setNotice({
        message:
          "Backend response received. Review the formatted Terraform, validation logs, and security findings below.",
        tone: "info",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Workflow request failed unexpectedly.";

      setWorkflow(createWorkflowFailureViewModel(prompt, message));
      setNotice({ message, tone: "error" });
    }
  }

  function handleLoadSamplePrompt() {
    setPrompt(defaultInfrastructurePrompt);
    setNotice({
      message:
        "Sample prompt loaded. Run the workflow to call the Python API bridge.",
      tone: "info",
    });
  }

  function handleResetShell() {
    setPrompt("");
    setWorkflow(idleWorkflowViewModel);
    setNotice(null);
  }

  return (
    <main className="workflow-page">
      <section className="hero-panel">
        <p className="hero-eyebrow">Sprint 3 Checkov Gate</p>
        <h1 className="hero-title">
          Stage generation, validation, and security review from one page.
        </h1>
        <p className="hero-copy">
          This shell now calls the Python backend through a stable workflow API.
          Prompt entry, formatted Terraform output, Terraform logs, Checkov
          findings, and deploy readiness remain visible in one deliberate
          frontend surface while the no-deploy safety boundary stays intact.
        </p>
        <div className="hero-actions">
          <span className="hero-primary">Live Python generation, validation, and Checkov scanning</span>
          <span className="hero-secondary">Deploy stays disabled until GitOps lands</span>
        </div>
      </section>

      {notice ? (
        <p className={`notice notice--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
          {notice.message}
        </p>
      ) : null}

      <section className="workflow-layout">
        <Panel
          eyebrow="Prompt composer"
          title="Run the infrastructure request"
          description="The frontend now submits prompts through the Python workflow API instead of staging a local preview state."
          className="composer-panel"
        >
          <label className="composer-label" htmlFor="workflow-prompt">
            <span>Infrastructure request</span>
            <span className="composer-caption">AWS-only validation and security workflow</span>
          </label>
          <textarea
            className="workflow-textarea"
            id="workflow-prompt"
            name="workflow-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the infrastructure you want the backend to generate and validate."
          />

          <p className="composer-caption">
            Keep the Python backend service running locally when testing the live
            generation, validation, and Checkov path end to end.
          </p>

          <div className="composer-actions">
            <Button disabled={workflow.isBusy} onClick={handleRunWorkflow}>
              {workflow.isBusy ? "Running workflow..." : "Run workflow"}
            </Button>
            <Button onClick={handleLoadSamplePrompt} variant="secondary">
              Use sample prompt
            </Button>
            <Button onClick={handleResetShell} variant="ghost">
              Reset shell
            </Button>
          </div>
        </Panel>

        <Panel
          eyebrow="Execution status"
          title="Three gates, one visible state model"
          description="Generation, Terraform validation, and Checkov scanning each keep their own region so backend outcomes stay readable."
        >
          <WorkflowStatusList steps={workflow.steps} />
        </Panel>
      </section>

      <section className="workflow-output-grid">
        <Panel
          eyebrow="Generated Terraform"
          title="Code review panel"
          description="The validated Terraform stays separate from logs so operators can review code without losing backend feedback."
        >
          <div className="code-panel">
            <p className="code-panel__caption">
              The Python backend returns generated Terraform and the validation pass returns the formatted result shown here.
            </p>
            <pre aria-label="Generated Terraform output">{workflow.terraform}</pre>
          </div>
        </Panel>

        <Panel
          eyebrow="Backend feedback"
          title="Generation, validation, and security notes"
          description="Feedback remains split by concern so generation issues, Terraform failures, and Checkov blockers do not collapse into one generic output panel."
        >
          <ul className="feedback-list" aria-label="Backend feedback panels">
            {workflow.feedbackSections.map((section) => (
              <li className="feedback-card" key={section.id}>
                <span className="feedback-card__eyebrow">{section.label}</span>
                <p className="feedback-card__title">{section.title}</p>
                <p className="feedback-card__copy">{section.body}</p>
                {section.items?.length ? (
                  <ul className="feedback-card__items" aria-label={`${section.label} findings`}>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                {section.log ? <pre className="feedback-card__log">{section.log}</pre> : null}
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel
        eyebrow="Deploy readiness"
        title={workflow.readiness.title}
        description={workflow.readiness.detail}
        className="readiness-panel"
      >
        <div className={`readiness-banner readiness-banner--${workflow.readiness.tone}`}>
          <span className="readiness-banner__eyebrow">{workflow.readiness.label}</span>
          <p className="readiness-banner__title">{workflow.readiness.summary}</p>
          <p className="readiness-banner__copy">{workflow.readiness.deployHint}</p>
        </div>

        <div className="readiness-actions">
          <Button disabled>Deploy to GitHub</Button>
          <p className="readiness-note">
            The control is intentionally disabled until Sprint 4 wires branch creation,
            commit delivery, and pull-request creation.
          </p>
        </div>
      </Panel>
    </main>
  );
}