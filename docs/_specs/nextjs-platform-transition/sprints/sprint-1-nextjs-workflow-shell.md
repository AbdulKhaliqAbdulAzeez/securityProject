# Sprint 1: Next.js Workflow Shell

## Goal

Build the primary Next.js workflow page and shared UI shell that replace the
current Streamlit frontend experience.

## Governing Spec Sections

- Product Thesis
- Architecture
- UX Requirements
- Verification Strategy

## Verified Available Assets

- the reference repository's root `app/`, `components/`, and `lib/` layout
- the current user flow and state model in `app.py`
- the baseline Next.js workspace established in Sprint 0

## Artifact Targets

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/site/`
- `components/ui/`
- `components/workflow/`
- `lib/`
- frontend tests under `tests/app/` and `tests/browser/`

## Tasks

1. create the shared application shell, layout, and styling primitives for the
   new frontend
2. implement a workflow page with prompt input, execution controls, and clear
   status regions for generation, validation, and security scanning
3. add dedicated panels for generated Terraform and backend feedback instead of
   one generic output area
4. include a disabled `Deploy to GitHub` control and readiness state so the UI
   models the future GitOps flow early
5. add frontend tests that cover the primary shell, empty-state rendering, and
   key workflow states

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Browser smoke test after the page exists:

```bash
npm run test:browser
```

## Completion Checklist

- the Next.js frontend exposes one primary workflow page
- the new UI covers the current Streamlit information surface without copying
  Streamlit-specific implementation choices
- readiness and deploy states are visible even before GitOps is wired
- frontend tests cover the main rendering states

## QA Deviations

- none recorded yet