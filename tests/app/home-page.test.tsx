import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import Home from "@/app/page";
import type { WorkflowApiResponse } from "@/lib/workflow-api";

type MockFetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

const fetchMock = vi.fn<(...args: Array<unknown>) => Promise<MockFetchResponse>>();

function createFetchResponse(
  body: unknown,
  init: { ok?: boolean; status?: number } = {},
): MockFetchResponse {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  };
}

function createSuccessfulWorkflowResponse(
  overrides: Partial<WorkflowApiResponse> = {},
): WorkflowApiResponse {
  return {
    request: {
      prompt: "Create an AWS S3 bucket with public access blocked.",
    },
    generation: {
      status: "succeeded",
      used_fallback: false,
      message: "Terraform generated successfully from the Gemini-backed model.",
    },
    terraform: {
      generated_code: 'resource "aws_s3_bucket" "demo" {}',
      formatted_code: 'resource "aws_s3_bucket" "demo" {}',
    },
    validation: {
      status: "passed",
      message: "Terraform validation passed.",
      logs: [
        {
          command: "terraform validate -no-color",
          return_code: 0,
          stdout: "Success!",
          stderr: "",
        },
      ],
      combined_log: "$ terraform validate -no-color\n\nexit code: 0\n\nstdout:\nSuccess!\n\nstderr:\n",
    },
    security: {
      status: "passed",
      message: "Checkov security scan passed with no blocking findings.",
      findings: [],
      log: {
        command: "checkov -d . --framework terraform --output json",
        return_code: 0,
        stdout: '{"results": {"failed_checks": []}}',
        stderr: "",
      },
    },
    readiness: {
      is_ready: true,
      status: "ready",
      message:
        "Terraform validation and Checkov security scanning passed. This document is ready for the later GitOps handoff.",
      deploy_hint:
        "Deploy to GitHub remains disabled until Sprint 4 adds GitOps delivery, even when validation and security scanning pass.",
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("Home page", () => {
  it("renders the workflow shell empty state with disabled deploy", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /Stage generation, validation, and security review from one page\./i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Infrastructure request/i)).toBeInTheDocument();
    expect(screen.getByText(/Waiting on validation/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Deploy to GitHub/i })).toBeDisabled();
    expect(
      screen.getByLabelText(/Generated Terraform output/i),
    ).toHaveTextContent(/Generated Terraform output will appear here/i);
  });

  it("shows an alert when running without a prompt", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Run workflow/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /Enter an infrastructure request before running the workflow\./i,
    );
    expect(screen.getByText(/Waiting for prompt/i)).toBeInTheDocument();
  });

  it("renders a clean backend scan as ready for GitOps handoff", async () => {
    fetchMock.mockResolvedValue(createFetchResponse(createSuccessfulWorkflowResponse()));

    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Use sample prompt/i }));
    fireEvent.click(screen.getByRole("button", { name: /Run workflow/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/workflow",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(await screen.findByText(/^Ready$/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready for GitOps handoff/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Generation$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Validation$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Security$/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Generated Terraform output/i)).toHaveTextContent(
      /resource "aws_s3_bucket" "demo" \{\}/i,
    );
    expect(screen.getAllByText(/Terraform validation passed\./i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Checkov security scan passed with no blocking findings\./i)
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Success!/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Deploy to GitHub/i })).toBeDisabled();
  });

  it("maps backend validation failures into readable UI states", async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        createSuccessfulWorkflowResponse({
          generation: {
            status: "fallback",
            used_fallback: true,
            message:
              "No Gemini API key is configured. Using the safe fallback Terraform document instead of a live model response.",
          },
          validation: {
            status: "failed",
            message: "Terraform validation failed. Review the command logs below.",
            logs: [
              {
                command: "terraform",
                return_code: 127,
                stdout: "",
                stderr: "Terraform CLI not found on PATH.",
              },
            ],
            combined_log:
              "$ terraform\n\nexit code: 127\n\nstdout:\n\nstderr:\nTerraform CLI not found on PATH.",
          },
          security: {
            status: "not_run",
            message:
              "Security scanning did not run because Terraform validation failed.",
            findings: [],
            log: null,
          },
          readiness: {
            is_ready: false,
            status: "blocked_by_validation",
            message:
              "Terraform validation failed, so deployment remains blocked until the validation errors are resolved.",
            deploy_hint:
              "Deploy to GitHub remains disabled until Sprint 4 adds GitOps delivery, even when validation and security scanning pass.",
          },
        }),
      ),
    );

    render(<Home />);

    fireEvent.change(screen.getByLabelText(/Infrastructure request/i), {
      target: { value: "Create infrastructure" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run workflow/i }));

    expect(await screen.findByText(/Blocked by validation/i)).toBeInTheDocument();
    expect(screen.getByText(/Not ready to deploy/i)).toBeInTheDocument();
    expect(screen.getByText(/Fallback Terraform returned/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(/Terraform validation failed\. Review the command logs below\./i)
        .length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/Terraform CLI not found on PATH\./i)).toBeInTheDocument();
    expect(screen.getByText(/^Failed$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Deploy to GitHub/i })).toBeDisabled();
  });

  it("shows specific Checkov findings when security scanning blocks readiness", async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        createSuccessfulWorkflowResponse({
          security: {
            status: "failed",
            message:
              "Checkov reported 1 blocking security finding. Review the findings below before treating this Terraform as ready.",
            findings: [
              {
                check_id: "CKV_AWS_20",
                check_name:
                  "S3 Bucket has an ACL defined which allows public READ access.",
                resource: "aws_s3_bucket.demo",
                file_path: "/main.tf",
                file_line_range: "1-3",
                guideline:
                  "https://docs.bridgecrew.io/docs/s3_2-acl-read-permissions-everyone",
              },
            ],
            log: {
              command: "checkov -d . --framework terraform --output json",
              return_code: 1,
              stdout: '{"results": {"failed_checks": [{"check_id": "CKV_AWS_20"}]}}',
              stderr: "",
            },
          },
          readiness: {
            is_ready: false,
            status: "blocked_by_security",
            message:
              "Checkov reported blocking security findings, so deployment remains blocked until the issues are resolved.",
            deploy_hint:
              "Deploy to GitHub remains disabled until Sprint 4 adds GitOps delivery, even when validation and security scanning pass.",
          },
        }),
      ),
    );

    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Use sample prompt/i }));
    fireEvent.click(screen.getByRole("button", { name: /Run workflow/i }));

    expect(await screen.findByText(/Blocked by security/i)).toBeInTheDocument();
    expect(screen.getByText(/Checkov reported 1 blocking finding/i)).toBeInTheDocument();
    expect(screen.getByText(/CKV_AWS_20:/i)).toBeInTheDocument();
    expect(screen.getByText(/aws_s3_bucket\.demo/i)).toBeInTheDocument();
  });

  it("surfaces missing Checkov setup as a readable blocker", async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        createSuccessfulWorkflowResponse({
          security: {
            status: "scanner_unavailable",
            message:
              "Checkov CLI not found on PATH. Install Checkov locally before running security scanning.",
            findings: [],
            log: {
              command: "checkov",
              return_code: 127,
              stdout: "",
              stderr:
                "Checkov CLI not found on PATH. Install Checkov locally before running security scanning.",
            },
          },
          readiness: {
            is_ready: false,
            status: "blocked_by_security_setup",
            message:
              "Terraform validation passed, but security scanning is blocked until Checkov is installed locally.",
            deploy_hint:
              "Deploy to GitHub remains disabled until Sprint 4 adds GitOps delivery, even when validation and security scanning pass.",
          },
        }),
      ),
    );

    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Use sample prompt/i }));
    fireEvent.click(screen.getByRole("button", { name: /Run workflow/i }));

    expect(await screen.findByText(/Blocked by scanner setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Checkov setup required/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Checkov CLI not found on PATH/i).length).toBeGreaterThan(0);
  });

  it("shows a readable backend transport error", async () => {
    fetchMock.mockResolvedValue(
      createFetchResponse(
        {
          message:
            "Python backend is unavailable. Start it with `python -m uvicorn backend.api:app --reload --host 127.0.0.1 --port 8000` and retry.",
        },
        { ok: false, status: 503 },
      ),
    );

    render(<Home />);

    fireEvent.change(screen.getByLabelText(/Infrastructure request/i), {
      target: { value: "Create infrastructure" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Run workflow/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Python backend is unavailable/i,
    );
    expect(screen.getByText(/Blocked by backend error/i)).toBeInTheDocument();
    expect(screen.getByText(/^Backend request failed$/i)).toBeInTheDocument();
  });
});