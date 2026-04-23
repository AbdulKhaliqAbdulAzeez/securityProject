"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { WorkflowStatusList } from "@/components/workflow/workflow-status-list";
import {
  createWorkflowPreview,
  defaultInfrastructurePrompt,
  emptyWorkflowPreview,
  scenarioOptions,
  type NoticeTone,
  type WorkflowPreview,
  type WorkflowScenarioId,
} from "@/lib/workflow";

type WorkflowNotice = {
  message: string;
  tone: NoticeTone;
};

export function WorkflowShell() {
  const [prompt, setPrompt] = useState("");
  const [scenario, setScenario] = useState<WorkflowScenarioId>("blocked");
  const [preview, setPreview] = useState<WorkflowPreview>(emptyWorkflowPreview);
  const [notice, setNotice] = useState<WorkflowNotice | null>(null);

  function handleStageWorkflow() {
    if (!prompt.trim()) {
      setNotice({
        message:
          "Enter an infrastructure request before staging the workflow shell preview.",
        tone: "error",
      });
      setPreview(emptyWorkflowPreview);
      return;
    }

    setPreview(createWorkflowPreview(prompt, scenario));
    setNotice({
      message:
        "Preview staged. Sprint 2 will replace this shell state with live Python backend responses.",
      tone: "info",
    });
  }

  function handleLoadSamplePrompt() {
    setPrompt(defaultInfrastructurePrompt);
    setNotice({
      message:
        "Sample prompt loaded. Stage the workflow shell to preview validation and readiness states.",
      tone: "info",
    });
  }

  function handleResetShell() {
    setPrompt("");
    setPreview(emptyWorkflowPreview);
    setNotice(null);
  }

  return (
    <main className="workflow-page">
      <section className="hero-panel">
        <p className="hero-eyebrow">Sprint 1 Next.js Workflow Shell</p>
        <h1 className="hero-title">
          Stage generation, validation, and security review from one page.
        </h1>
        <p className="hero-copy">
          This shell keeps the verified backend contract visible while moving the
          interaction model into a structured Next.js frontend. Prompt entry,
          Terraform review, backend feedback, and deploy readiness now live in one
          deliberate workflow surface.
        </p>
        <div className="hero-actions">
          <span className="hero-primary">Prompt, status, and output in one shell</span>
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
          title="Stage the infrastructure request"
          description="The shell now owns prompt entry and execution controls even before the Python API bridge is wired."
          className="composer-panel"
        >
          <label className="composer-label" htmlFor="workflow-prompt">
            <span>Infrastructure request</span>
            <span className="composer-caption">AWS-only validation workflow</span>
          </label>
          <textarea
            className="workflow-textarea"
            id="workflow-prompt"
            name="workflow-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the infrastructure you want the backend to generate and validate."
          />

          <div className="scenario-block">
            <p className="scenario-caption">Preview mode</p>
            <div className="scenario-picker" aria-label="Preview modes">
              {scenarioOptions.map((option) => (
                <button
                  aria-pressed={scenario === option.id}
                  className="scenario-pill"
                  key={option.id}
                  onClick={() => setScenario(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="scenario-caption">
              {
                scenarioOptions.find((option) => option.id === scenario)?.description
              }
            </p>
          </div>

          <div className="composer-actions">
            <Button onClick={handleStageWorkflow}>Stage workflow</Button>
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
          description="Generation, Terraform validation, and future security scanning each keep their own region so later backend integration is explicit."
        >
          <WorkflowStatusList steps={preview.steps} />
        </Panel>
      </section>

      <section className="workflow-output-grid">
        <Panel
          eyebrow="Generated Terraform"
          title="Code review panel"
          description="The frontend now reserves a dedicated Terraform surface instead of collapsing code and logs into one block."
        >
          <div className="code-panel">
            <p className="code-panel__caption">
              This preview models the future backend response while Sprint 2 builds the API contract.
            </p>
            <pre aria-label="Generated Terraform output">{preview.terraform}</pre>
          </div>
        </Panel>

        <Panel
          eyebrow="Backend feedback"
          title="Generation, validation, and security notes"
          description="Feedback remains split by concern so generation issues, Terraform failures, and security blockers do not collapse into one generic output panel."
        >
          <ul className="feedback-list" aria-label="Backend feedback panels">
            {preview.feedbackSections.map((section) => (
              <li className="feedback-card" key={section.id}>
                <span className="feedback-card__eyebrow">{section.label}</span>
                <p className="feedback-card__title">{section.title}</p>
                <p className="feedback-card__copy">{section.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <Panel
        eyebrow="Deploy readiness"
        title={preview.readiness.title}
        description={preview.readiness.detail}
        className="readiness-panel"
      >
        <div className={`readiness-banner readiness-banner--${preview.readiness.tone}`}>
          <span className="readiness-banner__eyebrow">{preview.readiness.label}</span>
          <p className="readiness-banner__title">{preview.readiness.summary}</p>
          <p className="readiness-banner__copy">{preview.readiness.deployHint}</p>
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