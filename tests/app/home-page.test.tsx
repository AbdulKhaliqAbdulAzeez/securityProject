import { describe, expect, it } from "vitest";

import { render, screen } from "@testing-library/react";

import Home from "@/app/page";

describe("Home page", () => {
  it("renders the sprint bootstrap message", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /Next\.js at the edge of the repo\. Python at the core of the workflow\./i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Backend runtime/i)).toBeInTheDocument();
    expect(screen.getByText(/Vitest owns the frontend surface/i)).toBeInTheDocument();
  });
});