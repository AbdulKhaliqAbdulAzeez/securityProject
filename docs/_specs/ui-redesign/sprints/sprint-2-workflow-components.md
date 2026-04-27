# Sprint 2: Workflow Components

## Goal

Build out the specific components for the "Command Center" UI, including the sticky prompt controls, the tabbed output workspace, and the workflow progress rail.

## Governing Spec Sections

- Primary Design Goals
- Frontend Surface Updates

## Artifact Targets

- `components/workflow/` (Prompt controls, output tabs, progress rail)
- `app/page.tsx` (integrating the components)

## Tasks

1.  Move the prompt textarea and submit controls into the left pane, styling it as the primary action surface.
2.  Implement a Workflow Progress Rail across the top of the right pane showing the sequence: `Generation -> Validation -> Security -> Delivery`.
3.  Create a tabbed or segmented view component for the right pane to switch between "Generated Code", "Validation Logs", and "Security Findings".
4.  Update the display of the generated Terraform code to use the premium monospace font and a clear syntax-highlighting theme suitable for dark mode.
5.  Style Checkov findings and Terraform logs into readable, bounded panels rather than raw text dumps.

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Completion Checklist

-   The user can input prompts from the left pane and view outcomes in the right pane.
-   The Workflow Progress Rail accurately reflects the current status based on the backend state.
-   Output is neatly organized into tabs or segments, preventing excessive vertical scrolling.
-   Code and logs use the new typography tokens.

## QA Deviations

-   none recorded yet
