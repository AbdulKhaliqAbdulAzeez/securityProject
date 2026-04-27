import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

describe("Site frame", () => {
  it("renders the current transition status copy", () => {
    render(
      <>
        <SiteHeader />
        <SiteFooter />
      </>,
    );

    expect(screen.getAllByText(/AI-Powered Terraform Architect/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Checkov live/i)).toBeInTheDocument();
    expect(screen.getByText(/GitOps live/i)).toBeInTheDocument();
  });
});