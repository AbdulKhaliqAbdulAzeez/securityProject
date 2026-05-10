# Sprint 0: Spec And Layout Baseline

## Goal

Document the scroll transition and current implementation constraints.

## Governing Spec Sections

- Vision
- Goals
- UX Contract

## Verified Available Assets

- `ChatShell` renders `ChatHero`, `ChatMessage`, and `ChatInput`.
- `app/globals.css` currently controls page overflow and chat frame sizing.
- `playwright.config.ts` controls browser smoke server startup.

## Artifact Targets

- `docs/_specs/hero-chat-scroll/spec.md`
- `docs/_specs/hero-chat-scroll/sprint-0-layout-baseline.md`

## Tasks

1. Create the `hero-chat-scroll` workstream directory.
2. Record the desired hero-to-chat page flow.
3. Record the constraint that page overflow must move from hidden to scrollable.

## Verify

```bash
test -f docs/_specs/hero-chat-scroll/spec.md
```

## Completion Checklist

- Spec captures scroll behavior.
- Scope excludes backend/API changes.
