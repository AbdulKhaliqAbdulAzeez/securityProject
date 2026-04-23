import { expect, test } from "@playwright/test";

test("workflow shell renders prompt, live workflow feedback, and disabled deploy state", async ({
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
      }),
    });
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Stage generation, validation, and security review from one page\./i,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Infrastructure request")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Deploy to GitHub/i }),
  ).toBeDisabled();

  await page.getByRole("button", { name: /Use sample prompt/i }).click();
  await page.getByRole("button", { name: /Run workflow/i }).click();

  await expect(page.getByText(/Pending security review/i)).toBeVisible();
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
});