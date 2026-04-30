import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CodeCard } from "@/components/chat/cards/code-card";
import { DeliveryCard } from "@/components/chat/cards/delivery-card";
import { ReadinessCard } from "@/components/chat/cards/readiness-card";
import { SecurityCard } from "@/components/chat/cards/security-card";
import { ValidationCard } from "@/components/chat/cards/validation-card";
import { WorkflowApiResponse, WorkflowDeployResponse } from "@/lib/workflow-api";

const validation: WorkflowApiResponse["validation"] = {
  status: "failed",
  message: "Terraform validation failed.",
  logs: [],
  combined_log: "Error: invalid Terraform",
};

const failedSecurity: WorkflowApiResponse["security"] = {
  status: "failed",
  message: "Checkov reported findings.",
  findings: [
    {
      check_id: "CKV_AWS_21",
      check_name: "Ensure all data stored in the S3 bucket have versioning enabled",
      resource: "aws_s3_bucket.demo",
      file_path: "/main.tf",
      file_line_range: "1-4",
      guideline: "https://docs.bridgecrew.io/docs/s3_16-enable-versioning",
    },
  ],
  log: {
    command: "checkov -d .",
    return_code: 1,
    stdout: "failed checks",
    stderr: "",
  },
};

const passedSecurity: WorkflowApiResponse["security"] = {
  status: "passed",
  message: "Checkov security scan passed.",
  findings: [],
  log: null,
};

describe("chat result cards", () => {
  it("copies and downloads generated Terraform from the code card", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const createObjectURL = vi.fn(() => "blob:main-tf");
    const revokeObjectURL = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<CodeCard code={'resource "aws_s3_bucket" "demo" {}\n'} />);

    fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        'resource "aws_s3_bucket" "demo" {}\n'
      );
    });
    expect(screen.getByRole("button", { name: /copied/i })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /download/i }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:main-tf");
  });

  it("renders validation summary and raw logs", () => {
    render(<ValidationCard validation={validation} />);

    expect(screen.getByText("Terraform Validation")).toBeVisible();
    expect(screen.getByText("✗ Failed")).toBeVisible();
    expect(screen.getByText("Terraform validation failed.")).toBeVisible();
    expect(screen.getByText("Error: invalid Terraform")).toBeInTheDocument();
  });

  it("renders security findings and success states", () => {
    const { rerender } = render(<SecurityCard security={failedSecurity} />);

    expect(screen.getByText("1 finding")).toBeVisible();
    expect(screen.getByText(/CKV_AWS_21/)).toBeVisible();
    expect(screen.getByRole("link", { name: /view guideline/i })).toHaveAttribute(
      "href",
      failedSecurity.findings[0].guideline
    );

    rerender(<SecurityCard security={passedSecurity} />);
    expect(screen.getByText("0 findings")).toBeVisible();
    expect(
      screen.getByText(/No blocking Checkov findings/i)
    ).toBeVisible();
  });

  it("routes readiness actions back through chat commands", () => {
    const onAction = vi.fn();
    const { rerender } = render(
      <ReadinessCard
        readiness={{
          is_ready: false,
          status: "blocked_by_security",
          message: "Blocked by Checkov security findings.",
          deploy_hint: "Fix issues before deployment.",
        }}
        onAction={onAction}
      />
    );

    expect(screen.getByText("Security gate failed")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /auto-fix issues/i }));
    expect(onAction).toHaveBeenCalledWith("fix");

    rerender(
      <ReadinessCard
        readiness={{
          is_ready: true,
          status: "ready",
          message: "Configuration verified.",
          deploy_hint: "Ready for handoff.",
        }}
        onAction={onAction}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /deploy to github/i }));
    expect(onAction).toHaveBeenCalledWith("deploy");
  });

  it("renders delivery metadata and pull request link", () => {
    const delivery: WorkflowDeployResponse["delivery"] = {
      status: "succeeded",
      message: "Pull request opened.",
      branch_name: "terraform/chat-demo",
      commit_sha: "abcdef123456",
      pull_request_url: "https://github.com/example/repo/pull/7",
      pull_request_number: 7,
    };

    render(<DeliveryCard delivery={delivery} />);

    expect(screen.getByText("terraform/chat-demo")).toBeVisible();
    expect(screen.getByText("abcdef12")).toBeVisible();
    expect(screen.getByRole("link", { name: /view pull request #7/i })).toHaveAttribute(
      "href",
      delivery.pull_request_url
    );
  });
});
