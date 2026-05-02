# Sprint 2: Agent & Workflow Integration

## Goal

Wire `ChatShell` to the real backend. Build `lib/chat-agent.ts` — the client-side intent router that parses user messages, decides which API endpoint to call, and converts the API response into typed `ChatMessage` objects that get appended to the thread.

## Governing Spec Sections

- Architecture (Backend section)
- Intent Detection Strategy

## Artifact Targets

- `lib/chat-agent.ts` [NEW]
- `components/chat/chat-shell.tsx` [MODIFY]

## Tasks

### `lib/chat-agent.ts`

#### Types
```ts
type AgentContext = {
  terraformCode: string;
  validationErrors: string;
  securityFindings: string;
  isReady: boolean;
  prompt: string;         // last infrastructure request the user made
};

type AgentResult = {
  messages: ChatMessage[];   // 1–N messages to append to the thread
  nextContext: Partial<AgentContext>;  // state updates
};
```

#### `detectIntent(text, context): Intent`
Implement keyword matching:
- **GENERATE**: default intent when no code exists yet, or user describes new infrastructure.
- **FIX**: matches `/\b(fix|auto.?fix|resolve|correct|yes)\b/i` when `context.terraformCode` is non-empty and `context.isReady` is false.
- **DEPLOY**: matches `/\b(deploy|push|ship|send to github|submit)\b/i`.
- **RESET**: matches `/\b(reset|start over|clear|new request)\b/i`.
- **EXPLAIN**: fallback — a short contextual text reply with no API call.

#### `runAgent(text, context): Promise<AgentResult>`
1. Call `detectIntent`.
2. **GENERATE**: call `submitWorkflowRequest(text)`, convert response to messages: acknowledgment text → `CodeCard` message → `ValidationCard` message → `SecurityCard` message → `ReadinessCard` message. Update context with new terraform code and readiness.
3. **FIX**: call `submitFixRequest(context.prompt, context.terraformCode, context.validationErrors, context.securityFindings)`. Convert response same as GENERATE. Text preamble: `"Analysing the issues and regenerating..."`
4. **DEPLOY**: guard — if `!context.isReady`, return an error text message explaining why. Else call `submitWorkflowDeployRequest(context.prompt, context.terraformCode)`, convert to `DeliveryCard` message.
5. **RESET**: return a reset message + clear all context.
6. **EXPLAIN**: compose a brief help text inline (no API call).

#### Message factory helpers (internal)
- `workflowResponseToMessages(response, prompt): ChatMessage[]` — creates the sequence of 4 typed cards from a `WorkflowApiResponse`.
- `deliveryResponseToMessage(response): ChatMessage` — creates a `DeliveryCard` message.

### `components/chat/chat-shell.tsx` updates
1. Replace the mock 1-second stub with a real call to `runAgent(userText, currentContext)`.
2. Manage `AgentContext` as a second piece of state alongside `ChatState`.
3. Pass `isBusy` down to `<ChatInput disabled>` during the async call.
4. On RESET intent: clear `messages` back to the welcome message + reset context.

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run test:browser
```
