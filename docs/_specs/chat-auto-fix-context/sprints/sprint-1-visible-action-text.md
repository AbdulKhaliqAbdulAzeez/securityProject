# Sprint 1: Visible Action Text

## Goal

Replace raw button command bubbles with descriptive chat text while preserving
the existing fix and deploy action paths.

## Governing Spec Sections

- User Experience
- Interface Changes: Chat Actions
- Acceptance Criteria

## Verified Available Assets

- `components/chat/cards/readiness-card.tsx` owns the fix/deploy buttons.
- `components/chat/chat-shell.tsx` creates visible user messages and calls the agent.
- `components/chat/chat-message.tsx` passes card actions upward.
- `tests/app/chat-cards.test.tsx` covers card action wiring.
- `tests/app/chat-interface.test.tsx` covers chat shell behavior.

## Artifact Targets

- `lib/chat-state.ts`
- `components/chat/chat-shell.tsx`
- `components/chat/chat-message.tsx`
- `components/chat/cards/readiness-card.tsx`
- `tests/app/chat-cards.test.tsx`
- `tests/app/chat-interface.test.tsx`

## Tasks

1. Add a `ChatAction` union type.
2. Change card action props from string commands to typed actions.
3. Generate blocked-state-specific fix copy in `ReadinessCard`.
4. Let `ChatShell` send command text to the agent while rendering alternate
   visible text in the user bubble.
5. Update card and shell tests.

## Verify

```bash
npm test -- tests/app/chat-cards.test.tsx tests/app/chat-interface.test.tsx
```

## Completion Checklist

- [ ] The fix button no longer shows `fix` in the thread.
- [ ] The deploy button still triggers deploy.
- [ ] Tests cover visible fix copy.

