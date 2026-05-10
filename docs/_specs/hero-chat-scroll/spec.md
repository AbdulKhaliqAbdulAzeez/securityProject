# Hero-To-Chat Scroll Specification

## Vision

Make the first viewport a dedicated hero experience and place the operational chat workspace directly beneath it. Users should understand the product from the hero, then scroll into a full-screen chat surface that owns the rest of the application.

## Goals

- Let the page scroll naturally from hero to chat.
- Keep the hero dominant on initial load.
- Make the chat workspace fill the viewport once reached.
- Preserve existing chat workflow behavior, cards, reset, fix, deploy, suggestions, and hero CTAs.
- Configure Playwright around the app's normal development port.

## UX Contract

- The header and hero together fill the first viewport.
- The chat workspace begins below the hero and has a minimum height of one viewport.
- `Start building` scrolls to the chat workspace and focuses the textarea.
- `Use secure VPC prompt` scrolls to the chat workspace, fills the starter prompt, and focuses the textarea.
- After a message is sent, the hero is removed because the app is no longer in the empty state; the chat workspace remains the primary surface.

## Implementation Notes

- Use document-level scrolling for the hero-to-chat transition.
- Keep the message thread scrollable inside the chat workspace once the workspace is visible.
- Do not alter backend routes, Python workflow logic, or chat-agent intent detection.
- Playwright should run against `http://127.0.0.1:3003`, matching `npm run dev`.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:browser
```
