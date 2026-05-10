import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "@/app/page";
import { runAgent } from "@/lib/chat-agent";
import { createAssistantMessage } from "@/lib/chat-state";

// Mock runAgent
vi.mock("@/lib/chat-agent", () => ({
  runAgent: vi.fn(),
  detectIntent: vi.fn(),
}));

// Mock timers
vi.useFakeTimers();

describe("Chat Interface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the chat shell with a welcome message", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /Generate secure infrastructure with validation built in/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Hello! Describe the AWS infrastructure/i)
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(/Describe the infrastructure you need/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Terraform security chat workspace/i)
    ).toBeInTheDocument();
  });

  it("focuses and fills the chat input from hero actions", () => {
    render(<Home />);

    const input = screen.getByPlaceholderText(/Describe the infrastructure you need/i);

    fireEvent.click(screen.getByRole("button", { name: /Start building/i }));
    expect(input).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: /Use secure VPC prompt/i }));
    expect(input).toHaveValue(
      "Create a secure AWS VPC with public and private subnets, flow logs, restricted security groups, and encrypted storage"
    );
  });

  it("allows typing and sending a message", async () => {
    vi.mocked(runAgent).mockResolvedValue({
      messages: [
        createAssistantMessage("text", {
          text: 'I\'ve received your request for "Create an S3 bucket".',
        }),
      ],
      nextContext: {},
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Describe the infrastructure you need/i);
    const sendButton = screen.getByRole("button", { name: /Send message/i });

    // Initial state: button disabled
    expect(sendButton).toBeDisabled();

    // Type a message
    fireEvent.change(input, { target: { value: "Create an S3 bucket" } });
    expect(sendButton).not.toBeDisabled();

    // Send message
    await act(async () => {
      fireEvent.click(sendButton);
    });

    // User message should appear
    expect(screen.getByText("Create an S3 bucket")).toBeInTheDocument();

    // Assistant response should appear
    expect(
      screen.getByText(/I've received your request for "Create an S3 bucket"/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: /Generate secure infrastructure with validation built in/i,
      })
    ).not.toBeInTheDocument();

    // Thinking indicator should be gone (after runAgent resolves)
    expect(document.querySelector(".chat-thinking")).not.toBeInTheDocument();
  });

  it("handles Shift+Enter for newlines and Enter for submission", async () => {
    vi.mocked(runAgent).mockResolvedValue({
      messages: [createAssistantMessage("text", { text: "Reply" })],
      nextContext: {},
    });

    render(<Home />);
    const input = screen.getByPlaceholderText(/Describe the infrastructure you need/i) as HTMLTextAreaElement;

    // Type with Shift+Enter
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });

    // Type and press Enter
    fireEvent.change(input, { target: { value: "Submit this" } });
    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    });

    // Should appear in document
    expect(screen.getByText("Submit this")).toBeInTheDocument();
  });

  it("fills the input from an empty-state suggestion chip", () => {
    render(<Home />);

    const input = screen.getByPlaceholderText(/Describe the infrastructure you need/i);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Use suggested prompt: Create a private versioned S3 bucket with encryption and public access blocked/i,
      })
    );

    expect(input).toHaveValue(
      "Create a private versioned S3 bucket with encryption and public access blocked"
    );
  });

  it("shows an error toast when the agent returns an error message", async () => {
    vi.mocked(runAgent).mockResolvedValue({
      messages: [
        createAssistantMessage("error", {
          text: "Backend unavailable.",
        }),
      ],
      nextContext: {},
    });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Describe the infrastructure you need/i);
    fireEvent.change(input, { target: { value: "Create an S3 bucket" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    });

    expect(screen.getByRole("status")).toHaveTextContent("Backend unavailable.");
    expect(screen.getByText("System Error")).toBeInTheDocument();
  });

  it("shows descriptive fix action text while sending the hidden fix command", async () => {
    vi.mocked(runAgent)
      .mockResolvedValueOnce({
        messages: [
          createAssistantMessage("readiness", {
            readiness: {
              is_ready: false,
              status: "blocked_by_security",
              message: "Blocked by Checkov security findings.",
              deploy_hint: "Fix issues before deployment.",
            },
          }),
        ],
        nextContext: {
          terraformCode: "resource demo {}",
          prompt: "Create S3 bucket",
          readinessStatus: "blocked_by_security",
          validationStatus: "passed",
          securityStatus: "failed",
          securityFindingCount: 1,
        },
      })
      .mockResolvedValueOnce({
        messages: [
          createAssistantMessage("text", {
            text: "I'm repairing the Checkov security findings and will re-run the workflow checks.",
          }),
        ],
        nextContext: {},
      });

    render(<Home />);

    const input = screen.getByPlaceholderText(/Describe the infrastructure you need/i);
    fireEvent.change(input, { target: { value: "Create S3 bucket" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Send message/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /auto-fix issues/i }));
    });

    expect(runAgent).toHaveBeenLastCalledWith(
      "fix",
      expect.objectContaining({
        readinessStatus: "blocked_by_security",
        securityStatus: "failed",
      })
    );
    expect(screen.getByText("Fixing Checkov security findings.")).toBeInTheDocument();
    expect(screen.queryByText("fix")).not.toBeInTheDocument();
  });
});
