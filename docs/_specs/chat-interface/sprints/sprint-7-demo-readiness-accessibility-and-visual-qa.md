# Sprint 7: Demo Readiness, Accessibility, And Visual QA

## Goal

Prepare the chat command center for a polished demo by adding visual regression
coverage, keyboard accessibility checks, and final responsive refinements.

## Governing Spec Sections

- Design Goals §1: Chat Is Primary
- Design Goals §3: Rich Embedded Result Cards
- Design Goals §5: Retain All Existing Features

## Verified Available Assets

- `playwright.config.ts`
- `tests/browser/homepage-smoke.spec.ts`
- `tests/browser/chat-smoke.spec.ts`
- `components/chat/`
- `app/globals.css`
- `docs/_specs/chat-interface/site-grade-2026-04-30.md`

## Artifact Targets

- `tests/browser/visual-chat.spec.ts` [NEW]
- `tests/browser/accessibility-chat.spec.ts` [NEW]
- `app/globals.css`
- `components/chat/chat-input.tsx`
- `components/chat/chat-shell.tsx`
- `components/chat/cards/*.tsx`
- `docs/_specs/chat-interface/qa-pass-sprint-7.md` [NEW during QA]

## Tasks

1. Add Playwright visual smoke coverage for empty, successful workflow, blocked
   workflow, and delivery states at desktop and mobile viewports.
2. Store deterministic screenshot expectations or image artifacts according to
   the repo's preferred browser-test convention.
3. Add keyboard-only browser coverage for:
   - focusing suggestion chips
   - filling and sending a prompt
   - opening validation/security details
   - activating auto-fix and deploy buttons
4. Add reduced-motion CSS support for message entrance and delivery glow
   animations.
5. Verify focus styling is visible on chat input, icon buttons, card buttons,
   detail summaries, and pull-request links.
6. Audit color contrast for muted text in cards and user bubbles, then adjust
   tokens if needed.
7. Document final before/after grade and remaining demo risks.

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run test:browser
```

## Completion Checklist

- [ ] Visual browser coverage exists for desktop and mobile states.
- [ ] Keyboard-only navigation can complete the primary workflow.
- [ ] Focus states are visible across all interactive controls.
- [ ] Reduced-motion users are respected.
- [ ] The final site grade is updated after implementation.
- [ ] QA records any remaining demo risks.

## QA Deviations

- None yet.
