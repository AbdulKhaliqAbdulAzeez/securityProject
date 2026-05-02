# Chat-First Interface Specification

## Vision

Transform the "Command Center" from a form-and-button workflow into a **conversational AI chat interface**. The user describes what they want in plain English. The AI responds, orchestrates the full Terraform generation → validation → security scan → deployment pipeline, and surfaces all results as rich embedded cards directly inside the conversation thread.

The chat IS the application. Every workflow action is triggered through natural conversation rather than explicit button clicks.

---

## Design Goals

### 1. Chat Is Primary
- A full-page chat thread occupies the center of the screen.
- The user types a message (e.g. "I need a highly available S3 bucket with encryption and versioning") and presses Enter or clicks Send.
- The AI acknowledges, runs the workflow, and posts results back as a series of structured message cards.

### 2. Natural Language Workflow Control
The chat agent recognizes a set of conversational intents and maps them to backend actions:

| User says (examples) | Agent action |
|---|---|
| "Create a VPC with two subnets" | Calls `POST /workflow` → generates, validates, scans |
| "Yes, fix the security issues" / "Auto-fix it" | Calls `POST /fix` with existing code + error context |
| "Deploy it" / "Push to GitHub" | Calls `POST /deploy` after confirming readiness |
| "Reset" / "Start over" | Clears thread and resets workflow state |
| "Show me the code" | Scrolls to / highlights the code card |
| General questions (e.g. "What is Checkov?") | AI answers inline without triggering a backend call |

### 3. Rich Embedded Result Cards
Workflow results are never just text. They are typed message cards embedded in the thread:

- **`CodeCard`**: Syntax-highlighted Terraform viewer, copy button, download button.
- **`ValidationCard`**: Pass/fail status pill + collapsible raw log.
- **`SecurityCard`**: Checkov status pill + collapsible findings list with fix suggestions.
- **`ReadinessCard`**: Go/No-go status, with a one-click "Deploy to GitHub" or "Auto-Fix Issues" CTA embedded in the card.
- **`DeliveryCard`**: Branch name, commit SHA, live PR link.

### 4. Conversational State
The agent maintains context across the thread. If validation fails, it remembers the failing code and can auto-fix without the user re-describing the infrastructure request.

### 5. Retain All Existing Features
- Terraform generation via Gemini
- `terraform validate` + Checkov security scanning
- GitOps delivery via GitHub PR
- Auto-Fix Issues loop

---

## Architecture

### Frontend
- **`ChatShell`** (replaces `WorkflowShell`) — manages the message thread, user input, and chat state.
- **`ChatMessage`** — renders a single message (user or assistant). Delegates to specialized card components for structured content.
- **`ChatInput`** — a growing textarea + Send button fixed to the bottom of the viewport.
- **`lib/chat-agent.ts`** — client-side intent router. Parses user input, decides which backend call to make, formats the response into typed `ChatMessage` objects.
- **`lib/chat-state.ts`** — the chat view model: message thread, current terraform state, readiness, etc.

### Backend (no new endpoints needed)
All three existing endpoints (`/workflow`, `/fix`, `/deploy`) are reused. The intelligence about *when* to call which endpoint lives entirely in `lib/chat-agent.ts`.

---

## Message Model

```ts
type ChatMessageRole = "user" | "assistant";
type ChatCardType =
  | "text"
  | "thinking"
  | "code"
  | "validation"
  | "security"
  | "readiness"
  | "delivery"
  | "error";

type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  cardType: ChatCardType;
  text?: string;           // plain prose
  terraform?: string;      // for code card
  validation?: WorkflowValidationPayload;
  security?: WorkflowSecurityPayload;
  readiness?: WorkflowReadinessPayload;
  delivery?: WorkflowDeliveryPayload;
  timestamp: number;
};
```

---

## Intent Detection Strategy

`lib/chat-agent.ts` uses simple keyword/phrase matching (no extra AI call needed):

```
Intent: GENERATE
  triggers: any message that doesn't match fix/deploy/reset keywords
  assumption: if the user sends a substantive sentence and there's no active code,
              or they describe a NEW infrastructure need, treat it as a generation request.

Intent: FIX
  triggers: "fix", "auto-fix", "resolve", "yes" (when readiness is blocked), "correct it"

Intent: DEPLOY
  triggers: "deploy", "push", "submit", "send to github", "ship it"
  guard: readiness must be "ready" — otherwise agent explains why it can't deploy yet.

Intent: RESET
  triggers: "reset", "start over", "clear", "new request"

Intent: EXPLAIN
  triggers: anything else — answer with a contextual help message.
```

---

## Sprints

| Sprint | Name | Goal |
|--------|------|------|
| 0 | Chat Design Tokens | CSS tokens, message bubble styles, card container styles |
| 1 | Chat Shell & Input | `ChatShell`, `ChatInput`, `ChatMessage` rendering, thread layout |
| 2 | Agent & Workflow Integration | `chat-agent.ts` intent router wired to all three backend endpoints |
| 3 | Rich Result Cards | `CodeCard`, `ValidationCard`, `SecurityCard`, `ReadinessCard`, `DeliveryCard` |
| 4 | QA, Polish & Migration | Remove old `WorkflowShell`, update tests, final UX polish |
