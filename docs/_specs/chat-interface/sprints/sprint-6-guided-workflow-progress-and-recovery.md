# Sprint 6: Guided Workflow Progress And Recovery

## Goal

Make the AI workflow feel guided rather than abrupt by adding clear in-thread
progress states, better recovery actions, and stronger feedback when backend
services are unavailable.

## Governing Spec Sections

- Design Goals §2: Natural Language Workflow Control
- Design Goals §4: Conversational State
- Design Goals §5: Retain All Existing Features

## Verified Available Assets

- `lib/chat-agent.ts`
- `lib/workflow-api.ts`
- `components/chat/chat-shell.tsx`
- `components/chat/chat-message.tsx`
- `components/chat/cards/readiness-card.tsx`
- `app/api/workflow/route.ts`
- `app/api/fix/route.ts`
- `app/api/deploy/route.ts`
- `tests/app/chat-agent.test.ts`
- `tests/browser/homepage-smoke.spec.ts`

## Artifact Targets

- `lib/chat-agent.ts`
- `lib/chat-state.ts`
- `components/chat/chat-shell.tsx`
- `components/chat/chat-message.tsx`
- `components/chat/cards/readiness-card.tsx`
- `app/globals.css`
- `tests/app/chat-agent.test.ts`
- `tests/app/chat-interface.test.tsx`
- `tests/browser/homepage-smoke.spec.ts`

## Tasks

1. Replace the generic thinking dots with workflow-stage progress text for
   generation, validation, security scan, and readiness.
2. Keep progress messages compact so they do not clutter the final thread.
3. Add a retry action when `/api/workflow`, `/api/fix`, or `/api/deploy` returns
   an error.
4. Preserve the last failed user request so retry does not require retyping.
5. Improve deploy-blocked copy to name the specific gate that is currently
   blocking GitOps.
6. Add browser tests for backend unavailable, retry, deploy-blocked, and
   successful retry paths.
7. Add unit tests for error classification and retry context handling.

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run test:browser
```

## Completion Checklist

- [ ] Users can see which workflow stage is running.
- [ ] Backend failures produce a clear toast, thread card, and retry action.
- [ ] Retry reuses the failed request without retyping.
- [ ] Deploy-blocked messages identify validation or security gates.
- [ ] Tests cover workflow, fix, deploy, and retry failure paths.

## QA Deviations

- None yet.
