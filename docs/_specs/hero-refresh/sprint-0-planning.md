# Sprint 0: Spec And Asset Decision

## Goal

Define the hero refresh workstream and choose the local visual baseline.

## Governing Spec Sections

- Vision
- Goals
- UX Contract
- Content

## Verified Available Assets

- `components/chat/chat-shell.tsx` owns the chat empty state.
- `components/chat/chat-input.tsx` owns textarea focus and prompt entry.
- `public/workflow-grid.svg` is available as the local hero visual asset.

## Artifact Targets

- `docs/_specs/hero-refresh/spec.md`
- `docs/_specs/hero-refresh/sprint-0-planning.md`

## Tasks

1. Create the hero-refresh spec directory.
2. Write the governing spec.
3. Record the decision to use `public/workflow-grid.svg`.
4. Lock verification commands.

## Verify

```bash
test -f docs/_specs/hero-refresh/spec.md
test -f public/workflow-grid.svg
```

## Completion Checklist

- Spec exists and names the target UI behavior.
- Asset decision is recorded.
- Backend and API contracts are explicitly out of scope.
