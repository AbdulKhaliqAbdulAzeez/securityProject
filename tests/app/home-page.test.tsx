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
      status: "queued",
      message:
        "Security scanning is not wired yet. Sprint 3 will add Checkov and block readiness on findings.",
    },
    readiness: {
      is_ready: false,
      status: "pending_security",
      message:
        "Terraform validation passed, but deployment remains blocked until Sprint 3 adds security scanning.",
      deploy_hint:
        "Deploy to GitHub remains disabled until Sprint 3 adds security scanning and Sprint 4 adds GitOps delivery.",
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
    expect(screen.getByText(/Queued for Sprint 3/i)).toBeInTheDocument();
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

  it("renders a backend success response with validation logs", async () => {
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

    expect(await screen.findByText(/Pending security review/i)).toBeInTheDocument();
    expect(screen.getByText(/Validation passed, security still pending/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Generation$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Validation$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Security$/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Generated Terraform output/i)).toHaveTextContent(
      /resource "aws_s3_bucket" "demo" \{\}/i,
    );
    expect(screen.getAllByText(/Terraform validation passed\./i).length).toBeGreaterThan(0);
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
          readiness: {
            is_ready: false,
            status: "blocked_by_validation",
            message:
              "Terraform validation failed, so deployment remains blocked until the validation errors are resolved.",
            deploy_hint:
              "Deploy to GitHub remains disabled until Sprint 3 adds security scanning and Sprint 4 adds GitOps delivery.",
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