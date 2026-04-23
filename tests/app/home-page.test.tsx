import { describe, expect, it } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import Home from "@/app/page";

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
    ).toHaveTextContent(/Generated Terraform preview will appear here/i);
  });

  it("shows an alert when staging without a prompt", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Stage workflow/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      /Enter an infrastructure request before staging the workflow shell preview\./i,
    );
    expect(screen.getByText(/Waiting for prompt/i)).toBeInTheDocument();
  });

  it("renders the blocked preview state with dedicated feedback regions", () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText(/Infrastructure request/i), {
      target: { value: "Create an AWS S3 bucket with public read disabled." },
    });
    fireEvent.click(screen.getByRole("button", { name: /Stage workflow/i }));

    expect(screen.getByText(/Blocked by security review/i)).toBeInTheDocument();
    expect(screen.getByText(/Not ready to deploy/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Generation$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Validation$/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Security$/i).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Generated Terraform output/i)).toHaveTextContent(
      /Create an AWS S3 bucket with public read disabled\./i,
    );
  });

  it("renders the ready-state preview while keeping deploy disabled", () => {
    render(<Home />);

    fireEvent.click(screen.getByRole("button", { name: /Use sample prompt/i }));
    fireEvent.click(screen.getByRole("button", { name: /Ready-state preview/i }));
    fireEvent.click(screen.getByRole("button", { name: /Stage workflow/i }));

    expect(screen.getByText(/Ready for GitOps handoff/i)).toBeInTheDocument();
    expect(screen.getByText(/Ready state visible/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Passed$/i)).toHaveLength(2);
    expect(screen.getByRole("button", { name: /Deploy to GitHub/i })).toBeDisabled();
  });
});