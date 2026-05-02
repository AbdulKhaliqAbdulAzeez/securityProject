# Sprint 0: Design System & Theming Foundation

## Goal

Establish the visual foundation for the premium dark theme, including the color palette, typography, and core CSS variables or Tailwind configuration.

## Governing Spec Sections

- Primary Design Goals
- Design System

## Artifact Targets

- `app/globals.css`
- `tailwind.config.ts` (if applicable)
- `components/ui/` (updating primitives like Button, Input to match new tokens)

## Tasks

1.  Update global CSS or Tailwind config to use deep dark backgrounds (`#0A0A0A` to `#121212`).
2.  Define primary accent colors: Terraform Purple (`#844FBA`) and AI Cyan (`#00E5FF`).
3.  Define semantic colors for validation states (Emerald for success, Crimson for failure).
4.  Configure typography tokens using a modern sans-serif for UI (`Inter`, `Geist`) and a premium monospace for code (`JetBrains Mono`, `Fira Code`).
5.  Update existing primitive UI components (buttons, text inputs) to utilize the new dark theme tokens and subtle glassmorphic styling where appropriate.

## Verify

```bash
npm run typecheck
npm run lint
npm run build
```

## Completion Checklist

-   The application loads with the new dark background and typography by default.
-   Color tokens are centrally managed and successfully applied to primitive components.
-   No build errors or typecheck failures are introduced by style changes.

## QA Deviations

-   none recorded yet
