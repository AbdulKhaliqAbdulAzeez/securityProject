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
  await expect(
    page.getByLabel("Backend feedback panels").getByText(/Terraform validation passed\./i),
  ).toBeVisible();
  await expect(
    page
      .getByLabel("Backend feedback panels")
      .getByText(/Terraform generated successfully from the Gemini-backed model\./i),
  ).toBeVisible();
  await expect(page.getByLabel("Generated Terraform output")).toContainText(
    'resource "aws_s3_bucket" "demo" {}',
  );
  await expect(page.getByRole("button", { name: /Deploy to GitHub/i })).toBeEnabled();
});