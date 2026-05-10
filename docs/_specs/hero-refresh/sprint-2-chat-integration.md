# Sprint 2: Chat Integration

## Goal

Wire hero actions into the existing chat input.

## Governing Spec Sections

- UX Contract
- Implementation Notes

## Verified Available Assets

- `ChatInput` owns local textarea state.
- Suggested prompts are already passed into `ChatInput` during the empty state.

## Artifact Targets

- `components/chat/chat-shell.tsx`
- `components/chat/chat-input.tsx`
- `tests/app/chat-interface.test.tsx`

## Tasks

1. Expose `focus` and `fill` methods from `ChatInput`.
2. Connect **Start building** to textarea focus.
3. Connect **Use secure VPC prompt** to fill the starter prompt.
4. Add unit tests for hero rendering, focus, and prompt fill.

## Verify

```bash
npm run test
```

## Completion Checklist

- Primary CTA focuses the chat textarea.
- Secondary CTA fills the textarea without submitting.
- Existing suggestion chips still work.
