# Sprint 0: Chat Design Tokens & Message Styles

## Goal

Extend the existing design system in `app/globals.css` with CSS custom properties and base styles specific to the chat interface. No React components yet — only the visual layer.

## Governing Spec Sections

- Design Goals §1 (Chat Is Primary)
- Message Model (card types → visual treatment)

## Artifact Targets

- `app/globals.css`

## Tasks

1. **Layout tokens** — Add `.chat-frame` layout class: full-viewport flex column, header pinned at top, input bar pinned at bottom, scrollable thread in the middle.
2. **Thread container** — `.chat-thread`: `flex-direction: column`, `gap: 1.5rem`, `padding: 2rem`, max-width centered (e.g. `860px`), `overflow-y: auto`, `flex: 1`.
3. **Message bubbles**:
   - `.chat-bubble--user`: right-aligned pill, accent gradient background (`--accent` → purple), white text.
   - `.chat-bubble--assistant`: left-aligned, glass panel surface (`--panel`), `--ink` text, subtle border.
4. **Thinking indicator** — `.chat-thinking`: three animated dots (CSS keyframe pulse stagger) to show while the agent is working.
5. **Card containers** — `.chat-card`: glass panel with slightly stronger border than bubbles, `border-radius: 1rem`, `padding: 1.5rem`. Variants:
   - `.chat-card--success` (emerald border-left accent)
   - `.chat-card--failure` (crimson border-left accent)
   - `.chat-card--neutral` (default border)
   - `.chat-card--code` (dark background `#090909`, monospace font)
6. **Input bar** — `.chat-input-bar`: sticky bottom, glass blur backdrop, centered max-width, contains growing textarea + send button.
7. **Timestamp / role label** — `.chat-meta`: small muted uppercase label showing role and time.

## Verify

```bash
npm run typecheck
npm run lint
```
