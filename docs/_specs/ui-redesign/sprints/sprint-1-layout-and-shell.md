# Sprint 1: Layout & Shell Structure

## Goal

Replace the current vertical scroll layout with a two-column, split-pane "Command Center" workspace. Update the header and footer to match the new minimal product control-plane identity.

## Governing Spec Sections

- Primary Design Goals
- Frontend Surface Updates
- Architecture

## Artifact Targets

- `app/layout.tsx`
- `app/page.tsx`
- `components/site/Header.tsx` (or equivalent)
- `components/site/Footer.tsx` (or equivalent)

## Tasks

1.  Refactor `app/layout.tsx` to support a full-height workspace layout, removing excess padding typical of a document site.
2.  Update the site header and footer to be more compact, quiet, and visually integrated into the dark background.
3.  Implement a two-column grid in `app/page.tsx` (`1fr 2fr` or similar) to separate the input and output areas.
4.  Ensure the left column (input) is sticky or fixed relative to the viewport height.
5.  Ensure the right column (output) handles vertical scrolling independently.

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Completion Checklist

-   The page structure is explicitly a two-column split-pane layout.
-   The header and footer consume less vertical space and do not distract from the workspace.
-   The left pane remains visible while the right pane can scroll long content.

## QA Deviations

-   none recorded yet
