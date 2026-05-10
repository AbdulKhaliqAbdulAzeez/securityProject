# Sprint 1: Page Scroll Layout

## Goal

Split the empty-state screen into a full-viewport hero followed by a full-viewport chat workspace.

## Governing Spec Sections

- UX Contract
- Implementation Notes

## Verified Available Assets

- `ChatHero` is already isolated as a component.
- `ChatShell` owns the empty-state check.

## Artifact Targets

- `components/chat/chat-shell.tsx`
- `app/globals.css`

## Tasks

1. Wrap `ChatHero` in a `.chat-landing` section.
2. Wrap the thread and input in a `.chat-workspace` section.
3. Allow document-level scrolling in global layout CSS.
4. Make `.chat-landing` and `.chat-workspace` fill their intended viewport areas.

## Verify

```bash
npm run typecheck
npm run lint
```

## Completion Checklist

- Hero appears first.
- Chat workspace begins below the hero.
- The page can scroll naturally from hero to chat.
