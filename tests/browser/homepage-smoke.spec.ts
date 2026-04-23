import { expect, test } from "@playwright/test";

test("workflow shell renders prompt, status, and disabled deploy state", async ({
  page,
}) => {
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
  await page.getByRole("button", { name: /Ready-state preview/i }).click();
  await page.getByRole("button", { name: /Stage workflow/i }).click();

  await expect(page.getByText(/Ready for GitOps handoff/i)).toBeVisible();
  await expect(page.getByText(/Ready state visible/i)).toBeVisible();
});