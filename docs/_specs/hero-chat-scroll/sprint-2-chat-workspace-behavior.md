# Sprint 2: Chat Workspace Behavior

## Goal

Make hero actions position the user in the chat workspace without changing workflow semantics.

## Governing Spec Sections

- UX Contract

## Verified Available Assets

- `ChatInput` exposes `focus` and `fill`.
- `ChatShell` can hold refs for scroll targets and input actions.

## Artifact Targets

- `components/chat/chat-shell.tsx`
- `tests/app/chat-interface.test.tsx`

## Tasks

1. Add a workspace ref to `ChatShell`.
2. Scroll to the workspace before focus/prefill actions.
3. Preserve current empty-state suggestions.
4. Update unit tests to assert the workspace wrapper exists and CTA behavior still works.

## Verify

```bash
npm run test
```

## Completion Checklist

- `Start building` focuses the textarea.
- `Use secure VPC prompt` fills and focuses the textarea.
- Existing send, reset, fix, and deploy behavior remains unchanged.
