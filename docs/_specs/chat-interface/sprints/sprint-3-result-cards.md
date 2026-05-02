# Sprint 3: Rich Result Cards

## Goal

Replace the stub placeholder boxes from Sprint 1 with fully designed, interactive result cards rendered inside the chat thread.

## Governing Spec Sections

- Design Goals §3 (Rich Embedded Result Cards)

## Artifact Targets

- `components/chat/cards/code-card.tsx` [NEW]
- `components/chat/cards/validation-card.tsx` [NEW]
- `components/chat/cards/security-card.tsx` [NEW]
- `components/chat/cards/readiness-card.tsx` [NEW]
- `components/chat/cards/delivery-card.tsx` [NEW]
- `components/chat/chat-message.tsx` [MODIFY — wire up real cards]
- `app/globals.css` [MODIFY — card-specific styles]

## Tasks

### `components/chat/cards/code-card.tsx`
- `.chat-card.chat-card--code` container.
- Header row: "Generated Terraform" label + **Copy** button (copies to clipboard, shows ✓ for 2s) + **Download** button (`main.tf` download).
- Scrollable `<pre>` block with `--mono-font`, line-number gutter effect using CSS counters.
- Max height `400px`, internal scroll.
- Subtle cyan top border accent.

### `components/chat/cards/validation-card.tsx`
- Header: status pill (✓ Passed / ✗ Failed) with matching color.
- One-line summary message.
- Collapsible `<details>` section: "View raw logs" → shows `<pre>` of the combined log.
- Apply `.chat-card--success` or `.chat-card--failure` border variant.

### `components/chat/cards/security-card.tsx`
- Header: status pill + finding count badge (e.g. "3 findings").
- If `status === "passed"`: show a single success row.
- If `status === "failed"`: render a list of findings, each showing:
  - `check_id` + `check_name` as the title.
  - `resource` and `file_line_range` as subtitle.
  - `guideline` URL as a small link.
- Collapsible raw scan log.

### `components/chat/cards/readiness-card.tsx`
- Large go/no-go status display (`Ready for GitOps` / `Blocked`).
- If blocked: shows which gate failed (validation or security) with a short explanation.
- If blocked: shows an **"Auto-Fix Issues"** button that sends `"fix"` back through the chat agent.
- If ready: shows a primary **"Deploy to GitHub"** button that sends `"deploy"` back through the chat agent.
- Clicking either button appends a new user message to the thread and triggers the agent naturally.

### `components/chat/cards/delivery-card.tsx`
- Large green success header.
- Branch name chip.
- Commit SHA (truncated to 8 chars) chip.
- Prominent PR link button: "View Pull Request →".

### `components/chat/chat-message.tsx` updates
Replace stub placeholder boxes with real card components for `code`, `validation`, `security`, `readiness`, and `delivery` card types.

### CSS additions (`app/globals.css`)
- Code card gutter line numbers via CSS counter.
- Status pill styles (`.status-pill--pass`, `.status-pill--fail`, `.status-pill--neutral`).
- Finding item styles for security card.
- Delivery card success-glow animation.

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run test:browser
```
