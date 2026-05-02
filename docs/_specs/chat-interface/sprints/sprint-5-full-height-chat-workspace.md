# Sprint 5: Full-Height Chat Workspace

## Goal

Turn the chat interface into a true full-height application workspace: the
thread should occupy the available viewport, the composer should feel pinned to
the command surface, and the footer should never interrupt the active chat
experience.

## Governing Spec Sections

- Vision
- Design Goals §1: Chat Is Primary
- Design Goals §3: Rich Embedded Result Cards

## Verified Available Assets

- `components/chat/chat-shell.tsx`
- `components/chat/chat-input.tsx`
- `components/site/site-footer.tsx`
- `app/globals.css`
- Playwright screenshots in `test-results/site-grade/`

## Artifact Targets

- `app/globals.css`
- `app/layout.tsx`
- `components/site/site-footer.tsx`
- `components/chat/chat-shell.tsx`
- `components/chat/chat-input.tsx`
- `tests/browser/homepage-smoke.spec.ts`
- `tests/browser/chat-smoke.spec.ts`

## Tasks

1. Make the root site shell reserve the full viewport height for the chat
   command center.
2. Keep the chat thread as the only scrollable main region during active use.
3. Make the composer visually and behaviorally pinned to the bottom of the
   viewport without pushing the footer into the middle of the page.
4. Move or hide the footer for the app route so it does not split the empty
   state from the command surface.
5. Rebalance empty-state vertical spacing on desktop so the welcome message,
   suggestions, and composer feel intentionally grouped.
6. Rebalance mobile spacing so the header, chips, and composer fit without
   crowding.
7. Add Playwright assertions that desktop and mobile do not show horizontal
   overflow and that the composer remains visible after workflow cards append.

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run test:browser
```

## Completion Checklist

- [ ] The chat app fills the viewport on desktop.
- [ ] The chat thread is the primary scroll container.
- [ ] The composer remains visible after messages append.
- [ ] The footer no longer interrupts the active command surface.
- [ ] Desktop and mobile screenshots show no awkward blank document area.
- [ ] Browser smoke tests cover composer visibility and overflow.

## QA Deviations

- None yet.
