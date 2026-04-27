"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WorkflowProgressRail } from "@/components/workflow/workflow-progress-rail";
import {
  createRunningWorkflowViewModel,
  createWorkflowFailureViewModel,
  createWorkflowViewModelFromResponse,
  defaultInfrastructurePrompt,
  idleWorkflowViewModel,
  type NoticeTone,
  type WorkflowViewModel,
} from "@/lib/workflow";
import { submitWorkflowDeployRequest, submitWorkflowRequest } from "@/lib/workflow-api";

type WorkflowNotice = {
  message: string;
  tone: NoticeTone;
};

type DeploymentState = {
  status: "running" | "succeeded" | "failed";
  message: string;
  branchName?: string;
  pullRequestUrl?: string;
};

export function WorkflowShell() {
  const [prompt, setPrompt] = useState("");
  const [workflow, setWorkflow] = useState<WorkflowViewModel>(idleWorkflowViewModel);
  const [notice, setNotice] = useState<WorkflowNotice | null>(null);
  const [deployment, setDeployment] = useState<DeploymentState | null>(null);
  const [activeTab, setActiveTab] = useState("code");

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

    setDeployment(null);
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

  async function handleDeployToGitHub() {
    if (!workflow.readiness.isReady) {
      setNotice({
        message:
          "Deploy to GitHub stays disabled until Terraform validation and Checkov both pass.",
        tone: "error",
      });
      return;
    }

    setDeployment({
      status: "running",
      message:
        "Creating a GitHub branch, committing main.tf, and opening a pull request.",
    });
    setNotice({
      message: "Submitting the validated Terraform to the GitOps delivery endpoint.",
      tone: "info",
    });

    try {
      const response = await submitWorkflowDeployRequest(
        workflow.sourcePrompt,
        workflow.terraform,
      );
      setDeployment({
        status: "succeeded",
        message: response.delivery.message,
        branchName: response.delivery.branch_name,
        pullRequestUrl: response.delivery.pull_request_url,
      });
      setNotice({
        message: "GitOps delivery succeeded. Review the pull request link below.",
        tone: "info",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "GitOps delivery failed unexpectedly.";

      setDeployment({ status: "failed", message });
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
    setDeployment(null);
    setNotice(null);
  }

  const isDeploying = deployment?.status === "running";
  const deployButtonDisabled = workflow.isBusy || isDeploying || !workflow.readiness.isReady;
  const readinessNote = workflow.readiness.isReady
    ? "GitOps delivery creates a unique branch, commits main.tf, and opens a pull request without mutating the default branch."
    : workflow.readiness.deployHint;

  return (
    <main className="workflow-page">
      <aside className="workflow-pane-left">
        <section className="hero-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
          <p className="hero-eyebrow">AI-Powered DevOps</p>
          <h1 className="hero-title" style={{ fontSize: '2rem', marginTop: '0.2rem' }}>
            Command Center
          </h1>
          <p className="hero-copy" style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
            Stage generation, validation, security review, and GitOps delivery from one workspace.
          </p>
        </section>

        {notice ? (
          <p className={`notice notice--${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"}>
            {notice.message}
          </p>
        ) : null}

        <Panel
          eyebrow="Prompt composer"
          title="Infrastructure request"
          className="composer-panel"
        >
          <textarea
            className={`workflow-textarea ${workflow.isBusy ? "workflow-textarea--generating" : ""}`}
            id="workflow-prompt"
            name="workflow-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe the infrastructure you want the backend to generate and validate."
          />

          <div className="composer-actions">
            <Button disabled={workflow.isBusy} onClick={handleRunWorkflow}>
              {workflow.isBusy ? "Running workflow..." : "Run workflow"}
            </Button>
            <Button onClick={handleLoadSamplePrompt} variant="secondary">
              Use sample prompt
            </Button>
            <Button onClick={handleResetShell} variant="ghost">
              Reset
            </Button>
          </div>
        </Panel>
      </aside>

      <section className="workflow-pane-right">
        <WorkflowProgressRail steps={workflow.steps} deploymentStatus={deployment?.status} />

        <Panel title="Workspace Output" className="workspace-panel">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="code">Generated Code</TabsTrigger>
              <TabsTrigger value="validation">Validation Logs</TabsTrigger>
              <TabsTrigger value="security">Security Findings</TabsTrigger>
            </TabsList>

            <TabsContent value="code">
              <div className="code-panel">
                <pre aria-label="Generated Terraform output">{workflow.terraform}</pre>
              </div>
            </TabsContent>

            <TabsContent value="validation">
              <ul className="feedback-list" aria-label="Validation feedback">
                {workflow.feedbackSections.filter(s => s.id === "validation" || s.id === "generation").map((section) => (
                  <li className="feedback-card" key={section.id}>
                    <span className="feedback-card__eyebrow">{section.label}</span>
                    <p className="feedback-card__title">{section.title}</p>
                    <p className="feedback-card__copy">{section.body}</p>
                    {section.log ? <pre className="feedback-card__log">{section.log}</pre> : null}
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="security">
              <ul className="feedback-list" aria-label="Security feedback">
                {workflow.feedbackSections.filter(s => s.id === "security").map((section) => (
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
            </TabsContent>
          </Tabs>
        </Panel>

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
            <Button disabled={deployButtonDisabled} onClick={handleDeployToGitHub}>
              {isDeploying ? "Deploying..." : "Deploy to GitHub"}
            </Button>
            <p className="readiness-note">
              {readinessNote}
            </p>
          </div>

          {deployment ? (
            <div className={`deploy-result deploy-result--${deployment.status}`}>
              <span className="readiness-banner__eyebrow">GitOps delivery</span>
              <p className="deploy-result__title">{deployment.message}</p>
              {deployment.branchName ? (
                <p className="deploy-result__copy">Branch: {deployment.branchName}</p>
              ) : null}
              {deployment.pullRequestUrl ? (
                <p className="deploy-result__copy">
                  Pull request:{" "}
                  <a href={deployment.pullRequestUrl} rel="noreferrer" target="_blank">
                    {deployment.pullRequestUrl}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </section>
    </main>
  );
}