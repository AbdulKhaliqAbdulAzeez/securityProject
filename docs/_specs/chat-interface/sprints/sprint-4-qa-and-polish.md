# Sprint 4: QA, Polish & Migration

## Goal

Remove the old `WorkflowShell`, tighten the chat UX with micro-interactions and accessibility improvements, update all tests to reflect the new interface, and prepare the application for the demo.

## Governing Spec Sections

- Design Goals §5 (Retain All Existing Features)

## Artifact Targets

- `components/workflow/` [DELETE entire directory — superseded by `components/chat/`]
- `tests/browser/homepage-smoke.spec.ts` [MODIFY]
- `tests/app/home-page.test.tsx` [MODIFY if needed]
- `app/globals.css` [MODIFY — final polish]
- `components/chat/chat-shell.tsx` [MODIFY — UX polish]

## Tasks

### Cleanup
1. Delete `components/workflow/workflow-shell.tsx`, `workflow-progress-rail.tsx` after confirming nothing imports them.
2. Remove unused CSS classes from `app/globals.css` that relate to `.workflow-pane-left`, `.workflow-pane-right`, `.workflow-page`, and `.readiness-*` classes that are now owned by the chat cards.

### UX Polish
1. **Smooth scroll** — when a new message is appended, animate the scroll to bottom using `behavior: 'smooth'`.
2. **Message entrance animation** — new messages slide up with `slideUpFade` (already defined in the design system). Apply staggered entrance to multi-card batches (each card 80ms after the previous).
3. **Send button icon** — replace text with an SVG arrow-up icon. Animate `scale(0.9)` on press.
4. **Empty state** — when the thread only has the welcome message, show three suggestion chips below the input: "Create an S3 bucket", "Set up a VPC with subnets", "Provision an EC2 instance". Clicking a chip populates the textarea.
5. **Error toast** — display a top-right toast (auto-dismiss 5s) when the agent catches an error, in addition to posting the error card to the thread.
6. **Keyboard accessibility** — ensure all interactive elements (card buttons, copy button, collapse toggle) are focusable and have `aria-label`s.

### Responsive / Mobile
1. On screens < 640px: message bubbles take full width.
2. Input bar: `padding: 1rem`.
3. Cards: hide the line-number gutter on mobile.

### Testing
1. Rewrite `tests/browser/homepage-smoke.spec.ts`:
   - Verify welcome message appears.
   - Type a prompt into the chat input, press Enter.
   - Mock `/api/workflow` to return a passing response.
   - Assert `CodeCard`, `ValidationCard`, `SecurityCard`, and `ReadinessCard` appear in the thread.
   - Assert "Deploy to GitHub" button inside the `ReadinessCard` is visible and clickable.
2. Add a test for the Auto-Fix flow via chat: mock a failing security response, assert the readiness card shows the "Auto-Fix Issues" button, click it, mock a passing `/api/fix` response, assert the new cards appear.
3. Add a test for the Reset intent: type "reset", assert thread resets to only the welcome message.

### Final Commit
```bash
git add .
git commit -m "feat: Chat-first interface — conversational AI command center"
```

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run test:browser
source .venv/bin/activate && pytest
```
