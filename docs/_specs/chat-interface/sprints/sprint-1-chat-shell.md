# Sprint 1: Chat Shell & Message Rendering

## Goal

Build the core chat layout — the scrollable thread, message components, and the input bar. At the end of this sprint the UI renders a working chat page with placeholder/demo messages. No real backend calls yet.

## Governing Spec Sections

- Architecture (Frontend)
- Message Model

## Artifact Targets

- `components/chat/chat-shell.tsx` [NEW]
- `components/chat/chat-message.tsx` [NEW]
- `components/chat/chat-input.tsx` [NEW]
- `lib/chat-state.ts` [NEW]
- `app/page.tsx` (swap `WorkflowShell` → `ChatShell`)

## Tasks

### `lib/chat-state.ts`
1. Define the `ChatMessage` TypeScript type (see spec §Message Model).
2. Define `ChatState`: `{ messages: ChatMessage[]; terraformCode: string; readiness: ... | null; isBusy: boolean; }`.
3. Export helper `createUserMessage(text)` and `createAssistantMessage(cardType, payload)` factory functions.
4. Export `initialChatState`.

### `components/chat/chat-input.tsx`
1. Auto-growing `<textarea>` that expands up to 6 rows and then scrolls.
2. Submit on `Enter` (without Shift). Shift+Enter inserts a newline.
3. A circular **Send** button (cyan accent icon, disabled while `isBusy`).
4. Placeholder text: `"Describe the infrastructure you need, or ask a question..."`
5. Apply `.chat-input-bar` layout class from Sprint 0.

### `components/chat/chat-message.tsx`
1. Renders a single `ChatMessage` based on `role` and `cardType`.
2. `role === "user"` → right-aligned `.chat-bubble--user`.
3. `role === "assistant"` with `cardType === "text"` → left-aligned `.chat-bubble--assistant` with rendered text.
4. `cardType === "thinking"` → `.chat-thinking` animated dots (3 dots, staggered pulse).
5. Render a `.chat-meta` label (role name + relative timestamp) below each bubble.
6. Leave stubs for card types (`code`, `validation`, `security`, `readiness`, `delivery`) — render a plain grey placeholder box for now with the card type name.

### `components/chat/chat-shell.tsx`
1. Manage `ChatState` with `useState`.
2. Render the `.chat-frame` layout: header strip (logo + title "Command Center"), scrollable `.chat-thread`, and `<ChatInput>` pinned at bottom.
3. On mount, push a welcome `assistant/text` message: `"Hello! Describe the AWS infrastructure you'd like me to architect and I'll generate, validate, and secure the Terraform configuration for you."`
4. `handleSend(text)`: append a `user/text` message, append a `assistant/thinking` message, then (for now) replace the thinking message with a stub `assistant/text` reply after a 1-second timeout.
5. Auto-scroll to the bottom of the thread whenever `messages` changes.

### `app/page.tsx`
1. Replace `<WorkflowShell />` with `<ChatShell />`.
2. Keep the `<SiteHeader>` and `<SiteFooter>` in place.

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run test:browser
```
