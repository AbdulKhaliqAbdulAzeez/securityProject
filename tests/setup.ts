import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

if (typeof window !== "undefined") {
  window.HTMLElement.prototype.scrollTo = vi.fn();
}