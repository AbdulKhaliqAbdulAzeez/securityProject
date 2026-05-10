# Sprint 1: Hero Shell

## Goal

Render the static hero in the initial chat state without changing workflow behavior.

## Governing Spec Sections

- UX Contract
- Content
- Implementation Notes

## Verified Available Assets

- `ChatShell` can detect the welcome-only state from `state.messages.length === 1`.
- Global CSS already contains chat layout and dark design tokens.

## Artifact Targets

- `components/chat/chat-shell.tsx`
- `components/chat/chat-hero.tsx`
- `app/globals.css`

## Tasks

1. Add a `ChatHero` component with the approved copy, pills, and CTAs.
2. Render `ChatHero` only in the welcome-only state.
3. Add image-backed hero styles using `public/workflow-grid.svg`.
4. Keep the existing welcome message and input bar visible/reachable.

## Verify

```bash
npm run typecheck
npm run lint
```

## Completion Checklist

- Hero renders in the initial chat state.
- Hero disappears after a user sends a prompt.
- Existing chat message rendering is unchanged.
