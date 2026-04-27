import { expect, test } from "@playwright/test";

test("workflow shell renders prompt, workflow feedback, and ready deploy state", async ({
  page,
}) => {
  await page.route("**/api/workflow", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        request: {
          prompt:
            "Create a highly available AWS EC2 web server with an application load balancer and a security group that allows HTTP traffic.",
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
          combined_log:
            "$ terraform validate -no-color\n\nexit code: 0\n\nstdout:\nSuccess!\n\nstderr:\n",
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
            "Deploy to GitHub stays gated until validation and Checkov pass, and delivery always creates a pull request instead of mutating the default branch.",
        },
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByText(/AI-Powered Terraform Architect/i).first()).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /Command Center/i,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Checkov live/i)).toBeVisible();
  await expect(page.getByText(/GitOps live/i)).toBeVisible();
  await expect(page.getByPlaceholder(/Describe the infrastructure you want/i)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Deploy to GitHub/i }),
  ).toBeDisabled();

  await page.getByRole("button", { name: /Use sample prompt/i }).click();
  await page.getByRole("button", { name: /Run workflow/i }).click();

  await expect(page.getByText(/Ready for GitOps handoff/i)).toBeVisible();

  await page.getByRole("tab", { name: /Validation Logs/i }).click();
  await expect(
    page.getByLabel("Validation feedback").getByText(/Terraform validation passed\./i),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Validation feedback")
      .getByText(/Terraform generated successfully from the Gemini-backed model\./i),
  ).toBeVisible();

  await page.getByRole("tab", { name: /Generated Code/i }).click();
  await expect(page.getByLabel("Generated Terraform output")).toContainText(
    'resource "aws_s3_bucket" "demo" {}',
  );
  await expect(page.getByRole("button", { name: /Deploy to GitHub/i })).toBeEnabled();
});
test("auto-fix issues handles blocked states", async ({ page }) => {
  await page.route("**/api/workflow", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        request: { prompt: "Create S3 bucket" },
        generation: { status: "succeeded", used_fallback: false, message: "Generated" },
        terraform: { generated_code: "resource aws_s3_bucket demo {}", formatted_code: "resource aws_s3_bucket demo {}" },
        validation: { status: "passed", message: "Passed", logs: [], combined_log: "" },
        security: { status: "failed", message: "Failed", findings: [], log: null },
        readiness: { is_ready: false, status: "blocked_by_security", message: "Blocked", deploy_hint: "Cannot deploy" }
      }),
    });
  });

  await page.route("**/api/fix", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        request: { prompt: "Create S3 bucket" },
        generation: { status: "succeeded", used_fallback: false, message: "Fixed" },
        terraform: { generated_code: "resource aws_s3_bucket demo { # fixed }", formatted_code: "resource aws_s3_bucket demo { # fixed }" },
        validation: { status: "passed", message: "Passed", logs: [], combined_log: "" },
        security: { status: "passed", message: "Passed", findings: [], log: null },
        readiness: { is_ready: true, status: "ready", message: "Ready", deploy_hint: "Can deploy" }
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: /Use sample prompt/i }).click();
  await page.getByRole("button", { name: /Run workflow/i }).click();

  await expect(page.getByText(/Blocked/i).first()).toBeVisible();
  
  const fixButton = page.getByRole("button", { name: /Auto-Fix Issues/i });
  await expect(fixButton).toBeVisible();
  await fixButton.click();

  await expect(page.getByText(/Ready/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Deploy to GitHub/i })).toBeEnabled();
});
