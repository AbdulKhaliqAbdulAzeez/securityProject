import { expect, test } from "@playwright/test";

test("chat interface renders and handles basic conversation (Sprint 1)", async ({
  page,
}) => {
  await page.goto("/");

  // Check for Header elements
  await expect(page.getByText(/AI-Powered Terraform Architect/i).first()).toBeVisible();
  await expect(page.getByText(/Checkov live/i)).toBeVisible();
  await expect(page.getByText(/GitOps live/i)).toBeVisible();

  // Check for Hero and below-the-fold chat workspace before touching chat content.
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
  await expect(
    page.getByText(/Hello! Describe the AWS infrastructure/i)
  ).toBeVisible();

  // Check for Input bar
  const textarea = page.getByPlaceholder(/Describe the infrastructure you need/i);
  await expect(textarea).toBeVisible();
  await page.getByRole("button", { name: /Use secure VPC prompt/i }).click();
  await expect.poll(async () => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(0);
  await expect(textarea).toHaveValue(
    "Create a secure AWS VPC with public and private subnets, flow logs, restricted security groups, and encrypted storage"
  );
  await expect(textarea).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: /Start building/i }).click();
  await expect.poll(async () => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(0);
  await expect(textarea).toBeFocused();

  const sendButton = page.getByRole("button", { name: /Send message/i });
  await textarea.fill("");
  await expect(sendButton).toBeDisabled();

  // Type a message
  await textarea.fill("I need an S3 bucket");
  await expect(sendButton).toBeEnabled();

  // Send the message
  await sendButton.click();

  // Check that user message appeared
  await expect(page.getByText("I need an S3 bucket", { exact: true })).toBeVisible();

  // Assistant should show "thinking" 
  // Narrow the search to the chat thread to avoid header/footer matches
  const thread = page.locator('.chat-thread');
  await expect(
    thread.getByText(/Terraform|error|received/i).first()
  ).toBeVisible({ timeout: 10000 });
  await expect(
    page.getByRole("heading", {
      name: /Generate secure infrastructure with validation built in/i,
    })
  ).not.toBeVisible();
  await expect(page.locator(".chat-workspace")).toBeInViewport();
});

test("chat interface resets on 'reset' command", async ({ page }) => {
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
  await textarea.fill("First test message");
  await textarea.press("Enter");
  
  const thread = page.locator('.chat-thread');
  await expect(thread.getByText(/First test message/i)).toBeVisible();

  await textarea.fill("reset");
  await textarea.press("Enter");

  // Thread should reset to the welcome-only state.
  await expect(thread.getByText(/Hello! Describe the AWS infrastructure/i)).toBeVisible();
  await expect(thread.getByText(/First test message/i)).not.toBeVisible();
  await expect(thread.locator(".chat-bubble")).toHaveCount(1);
});
