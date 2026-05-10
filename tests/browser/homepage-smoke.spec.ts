import { expect, test } from "@playwright/test";

test("chat command center renders workflow cards and deploys ready code", async ({
  page,
}) => {
  await page.route("**/api/workflow", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        request: {
          prompt: "Create an S3 bucket",
        },
        generation: {
          status: "succeeded",
          used_fallback: false,
          message: "Terraform generated successfully.",
          repair_attempts: 0,
          repair_applied: false,
          repair_exhausted: false,
        },
        terraform: {
          generated_code: 'resource "aws_s3_bucket" "demo" {}',
          formatted_code: 'resource "aws_s3_bucket" "demo" {}',
        },
        validation: {
          status: "passed",
          message: "Terraform validation passed.",
          logs: [],
          combined_log: "Success!",
        },
        security: {
          status: "passed",
          message: "Checkov security scan passed.",
          findings: [],
          log: null,
        },
        readiness: {
          is_ready: true,
          status: "ready",
          message: "Configuration verified.",
          deploy_hint: "Ready for handoff.",
        },
      }),
    });
  });

  await page.route("**/api/deploy", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        request: {
          prompt: "Create an S3 bucket",
        },
        delivery: {
          status: "succeeded",
          message: "Pull request opened.",
          branch_name: "terraform/chat-demo",
          commit_sha: "abcdef123456",
          pull_request_url: "https://github.com/example/repo/pull/7",
          pull_request_number: 7,
        },
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByText(/AI-Powered Terraform Architect/i).first()).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Generate secure infrastructure with validation built in/i,
    })
  ).toBeVisible();
  await expect.poll(async () => {
    return page.locator(".chat-workspace").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= window.innerHeight * 0.9;
    });
  }).toBe(true);
  await expect(page.getByText(/Hello! Describe the AWS infrastructure/i)).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Use suggested prompt: Create a private versioned S3 bucket with encryption and public access blocked/i,
    })
  ).toBeVisible();

  const textarea = page.getByPlaceholder(/Describe the infrastructure you need/i);
  await textarea.fill("Create an S3 bucket");
  await textarea.press("Enter");

  await expect(page.getByText(/Terraform generated successfully/i)).toBeVisible();
  await expect(page.locator('.chat-card-title').getByText(/Generated Terraform/i)).toBeVisible();
  await expect(page.locator('.chat-card-title').getByText(/Terraform Validation/i)).toBeVisible();
  await expect(page.locator('.chat-card-title').getByText(/Security Scan/i)).toBeVisible();
  await expect(page.locator('.chat-card-title').getByText(/Handoff Readiness/i)).toBeVisible();

  const deployButton = page.getByRole("button", { name: /Deploy to GitHub/i });
  await expect(deployButton).toBeVisible();
  await expect(deployButton).toBeEnabled();
  await deployButton.click();

  await expect(page.getByText("Deploy to GitHub", { exact: true })).toBeVisible();
  await expect(page.locator('.chat-card-title').getByText(/GitOps Delivery/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /View Pull Request #7/i })).toBeVisible();
});

test("auto-fix issues handles blocked states via chat", async ({ page }) => {
  const securityFinding = {
    check_id: "CKV_AWS_20",
    check_name: "S3 Bucket has an ACL defined which allows public READ access.",
    resource: "aws_s3_bucket.demo",
    file_path: "/main.tf",
    file_line_range: "1-3",
    guideline: "https://docs.prismacloud.io/policy-reference/aws-policies/aws-general-policies/bc-aws-s3-1",
  };

  await page.route("**/api/workflow", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        request: { prompt: "Create S3 bucket" },
        generation: {
          status: "succeeded",
          used_fallback: false,
          message: "Generated",
          repair_attempts: 0,
          repair_applied: false,
          repair_exhausted: false,
        },
        terraform: { generated_code: "resource aws_s3_bucket demo {}", formatted_code: "resource aws_s3_bucket demo {}" },
        validation: { status: "passed", message: "Passed", logs: [], combined_log: "" },
        security: { status: "failed", message: "Security findings found", findings: [securityFinding], log: null },
        readiness: { is_ready: false, status: "blocked_by_security", message: "Blocked by Checkov security findings.", deploy_hint: "" }
      }),
    });
  });

  await page.route("**/api/fix", async (route) => {
    const requestBody = route.request().postDataJSON();
    expect(requestBody.security_findings).toContain("CKV_AWS_20");
    expect(requestBody.security_findings).toContain("aws_s3_bucket.demo");
    expect(requestBody.security_findings).toContain("/main.tf:1-3");
    expect(requestBody.readiness_status).toBe("blocked_by_security");
    expect(requestBody.validation_status).toBe("passed");
    expect(requestBody.security_status).toBe("failed");
    expect(requestBody.security_finding_count).toBe(1);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        request: { prompt: "Create S3 bucket" },
        generation: {
          status: "succeeded",
          used_fallback: false,
          message: "Fixed",
          repair_attempts: 1,
          repair_applied: true,
          repair_exhausted: false,
        },
        terraform: { generated_code: "resource aws_s3_bucket demo { # fixed }", formatted_code: "resource aws_s3_bucket demo { # fixed }" },
        validation: { status: "passed", message: "Passed", logs: [], combined_log: "" },
        security: { status: "passed", message: "Passed", findings: [], log: null },
        readiness: { is_ready: true, status: "ready", message: "Ready", deploy_hint: "" }
      }),
    });
  });

  await page.goto("/");
  const textarea = page.getByPlaceholder(/Describe the infrastructure you need/i);
  await textarea.fill("Create S3 bucket");
  await textarea.press("Enter");

  await expect(page.getByText(/Blocked/i).first()).toBeVisible();
  
  const fixButton = page.getByRole("button", { name: /Auto-Fix Issues/i });
  await expect(fixButton).toBeVisible();
  await fixButton.click();

  await expect(page.getByText("Fixing Checkov security findings.")).toBeVisible();
  await expect(page.getByText("fix", { exact: true })).not.toBeVisible();
  await expect(page.getByText(/repairing the Checkov security findings/i)).toBeVisible();
  await expect(page.getByText(/Ready/i).first()).toBeVisible();
});

test("reset intent returns the chat thread to the welcome state", async ({ page }) => {
  await page.route("**/api/workflow", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        request: { prompt: "First test message" },
        generation: {
          status: "succeeded",
          used_fallback: false,
          message: "Generated",
          repair_attempts: 0,
          repair_applied: false,
          repair_exhausted: false,
        },
        terraform: { generated_code: "resource demo {}", formatted_code: "resource demo {}" },
        validation: { status: "passed", message: "Passed", logs: [], combined_log: "" },
        security: { status: "passed", message: "Passed", findings: [], log: null },
        readiness: { is_ready: true, status: "ready", message: "Ready", deploy_hint: "" }
      }),
    });
  });

  await page.goto("/");
  const textarea = page.getByPlaceholder(/Describe the infrastructure you need/i);
  const thread = page.locator(".chat-thread");

  await textarea.fill("First test message");
  await textarea.press("Enter");
  await expect(thread.getByText("First test message")).toBeVisible();

  await textarea.fill("reset");
  await textarea.press("Enter");

  await expect(thread.getByText(/Hello! Describe the AWS infrastructure/i)).toBeVisible();
  await expect(thread.getByText("First test message")).not.toBeVisible();
  await expect(thread.locator(".chat-bubble")).toHaveCount(1);
});
