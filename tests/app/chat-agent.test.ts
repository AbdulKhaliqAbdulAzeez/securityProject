import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AgentContext,
  detectIntent,
  runAgent,
} from "@/lib/chat-agent";
import {
  submitFixRequest,
  submitWorkflowDeployRequest,
  submitWorkflowRequest,
  WorkflowApiResponse,
} from "@/lib/workflow-api";

vi.mock("@/lib/workflow-api", () => ({
  submitFixRequest: vi.fn(),
  submitWorkflowDeployRequest: vi.fn(),
  submitWorkflowRequest: vi.fn(),
}));

const emptyContext: AgentContext = {
  terraformCode: "",
  validationErrors: "",
  securityFindings: "",
  isReady: false,
  prompt: "",
  readinessStatus: "",
  validationStatus: "",
  securityStatus: "",
  securityFindingCount: 0,
};

const blockedContext: AgentContext = {
  terraformCode: "resource \"aws_s3_bucket\" \"example\" {}",
  validationErrors: "terraform validate failed",
  securityFindings: "S3 bucket encryption missing",
  isReady: false,
  prompt: "Create an S3 bucket",
  readinessStatus: "blocked_by_security",
  validationStatus: "passed",
  securityStatus: "failed",
  securityFindingCount: 1,
};

const readyContext: AgentContext = {
  ...blockedContext,
  validationErrors: "",
  securityFindings: "",
  isReady: true,
};

const workflowResponse: WorkflowApiResponse = {
  request: {
    prompt: "Create an S3 bucket",
  },
  generation: {
    status: "succeeded",
    used_fallback: false,
    message: "Generated Terraform.",
    repair_attempts: 0,
    repair_applied: false,
    repair_exhausted: false,
  },
  terraform: {
    generated_code: "resource \"aws_s3_bucket\" \"example\" {}",
    formatted_code: "resource \"aws_s3_bucket\" \"example\" {}\n",
  },
  validation: {
    status: "passed",
    message: "Terraform validation passed.",
    logs: [],
    combined_log: "",
  },
  security: {
    status: "passed",
    message: "No Checkov findings.",
    findings: [],
    log: null,
  },
  readiness: {
    is_ready: true,
    status: "ready",
    message: "Ready for GitOps delivery.",
    deploy_hint: "Deploy when ready.",
  },
};

const workflowResponseWithSecurityFindings: WorkflowApiResponse = {
  ...workflowResponse,
  security: {
    status: "failed",
    message: "Checkov reported blocking security findings.",
    findings: [
      {
        check_id: "CKV_AWS_20",
        check_name: "S3 Bucket has an ACL defined which allows public READ access.",
        resource: "aws_s3_bucket.demo",
        file_path: "/main.tf",
        file_line_range: "1-3",
        guideline: "https://docs.prismacloud.io/en/enterprise-edition/policy-reference/aws-policies/aws-general-policies/bc-aws-s3-1",
      },
    ],
    log: null,
  },
  readiness: {
    is_ready: false,
    status: "blocked_by_security_findings",
    message: "Blocked by Checkov security findings.",
    deploy_hint: "Resolve findings before deploy.",
  },
};

describe("chat agent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("detects sprint 2 intents from user text and context", () => {
    expect(detectIntent("Create an S3 bucket", emptyContext)).toBe("GENERATE");
    expect(detectIntent("yes", blockedContext)).toBe("FIX");
    expect(detectIntent("Push to GitHub", readyContext)).toBe("DEPLOY");
    expect(detectIntent("please start over", readyContext)).toBe("RESET");
    expect(detectIntent("what now", readyContext)).toBe("EXPLAIN");
  });

  it("converts workflow responses into the expected card sequence", async () => {
    vi.mocked(submitWorkflowRequest).mockResolvedValue(workflowResponse);

    const result = await runAgent("Create an S3 bucket", emptyContext);

    expect(submitWorkflowRequest).toHaveBeenCalledWith("Create an S3 bucket");
    expect(result.messages.map((message) => message.cardType)).toEqual([
      "text",
      "code",
      "validation",
      "security",
      "readiness",
    ]);
    expect(result.nextContext).toMatchObject({
      terraformCode: workflowResponse.terraform.formatted_code,
      isReady: true,
      prompt: "Create an S3 bucket",
    });
  });

  it("guards deploy until the current workflow is ready", async () => {
    const result = await runAgent("deploy it", blockedContext);

    expect(submitWorkflowDeployRequest).not.toHaveBeenCalled();
    expect(result.messages[0]).toMatchObject({
      cardType: "text",
      text: expect.stringContaining("can't deploy yet"),
    });
  });

  it("uses the fix endpoint with stored workflow context", async () => {
    vi.mocked(submitFixRequest).mockResolvedValue(workflowResponse);

    const result = await runAgent("fix it", blockedContext);

    expect(submitFixRequest).toHaveBeenCalledWith(
      blockedContext.prompt,
      blockedContext.terraformCode,
      blockedContext.validationErrors,
      blockedContext.securityFindings,
      {
        readinessStatus: blockedContext.readinessStatus,
        validationStatus: blockedContext.validationStatus,
        securityStatus: blockedContext.securityStatus,
        securityFindingCount: blockedContext.securityFindingCount,
      }
    );
    expect(result.messages[0]).toMatchObject({
      cardType: "text",
      text: "I'm repairing the Checkov security findings and will re-run the workflow checks.",
    });
  });

  it("stores structured Checkov findings so auto-fix receives actionable context", async () => {
    vi.mocked(submitWorkflowRequest).mockResolvedValue(
      workflowResponseWithSecurityFindings
    );
    vi.mocked(submitFixRequest).mockResolvedValue(workflowResponse);

    const generateResult = await runAgent("Create an S3 bucket", emptyContext);
    const fixContext = {
      ...emptyContext,
      ...generateResult.nextContext,
    };

    await runAgent("fix", fixContext);

    expect(submitFixRequest).toHaveBeenCalledWith(
      "Create an S3 bucket",
      workflowResponse.terraform.formatted_code,
      "",
      expect.stringContaining("CKV_AWS_20"),
      {
        readinessStatus: "blocked_by_security_findings",
        validationStatus: "passed",
        securityStatus: "failed",
        securityFindingCount: 1,
      }
    );
    expect(submitFixRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.stringContaining("aws_s3_bucket.demo"),
      expect.any(Object)
    );
    expect(submitFixRequest).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.stringContaining("/main.tf:1-3"),
      expect.any(Object)
    );
  });

  it("returns a delivery card when ready code is deployed", async () => {
    vi.mocked(submitWorkflowDeployRequest).mockResolvedValue({
      request: {
        prompt: readyContext.prompt,
      },
      delivery: {
        status: "succeeded",
        message: "Pull request opened.",
        branch_name: "terraform/example",
        commit_sha: "abc123",
        pull_request_url: "https://github.com/example/repo/pull/1",
        pull_request_number: 1,
      },
    });

    const result = await runAgent("ship it", readyContext);

    expect(submitWorkflowDeployRequest).toHaveBeenCalledWith(
      readyContext.prompt,
      readyContext.terraformCode
    );
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].cardType).toBe("delivery");
  });
});
