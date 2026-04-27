# UI Redesign Specification

## Status

Active

## Problem Statement

The current application has successfully transitioned to a Next.js platform, but the visual design and user experience still retain an academic, document-like feel. To effectively demonstrate this tool's capabilities as a powerful AI-assisted Infrastructure as Code (IaC) generator and validator, the interface must reflect a modern, cutting-edge developer environment. The current warm color palette and top-to-bottom scrolling layout do not align with the expectations of an advanced DevOps tool.

## Product Thesis

The UI redesign should elevate the application from a functional MVP to a premium, demo-ready developer tool. By adopting a "Command Center" layout, a dark theme, and explicit workflow cues, the application will feel like a cohesive IDE rather than a web page, thereby enhancing its credibility and usability for technical demonstrations.

## Primary Design Goals

1.  Pivot to a premium dark mode default (`#0A0A0A` to `#121212`) to reduce eye strain and modernize the aesthetic.
2.  Implement a split-pane "Command Center" workspace, replacing the long vertical scroll.
3.  Enhance the prompt interface to feel like a primary control surface with AI generation state feedback.
4.  Organize output (Terraform code, validation logs, Checkov findings) into a tabbed or segmented workspace.
5.  Introduce a clear workflow progress rail (`Generation -> Validation -> Security -> Delivery`).
6.  Maintain readability and accessibility while employing a sophisticated color palette (Terraform-purple and AI-cyan accents).

## Scope

### In Scope

-   Update `tailwind.config.ts` (if using Tailwind) or `app/globals.css` to define the new design tokens (colors, typography).
-   Restructure `app/layout.tsx` and `app/page.tsx` to support a two-column, split-pane workspace.
-   Redesign the prompt textarea as a sticky left-pane control.
-   Implement a tabbed or segmented right-pane view for output surfaces.
-   Add a workflow progress rail component.
-   Apply micro-animations for hover states and AI generation pulsing.
-   Refine the header and footer to feel like a quiet product control plane.

### Out Of Scope

-   Changes to the Python backend generation, validation, or GitOps logic.
-   Adding new workflow steps (e.g., `terraform apply`).
-   Changing the underlying Next.js App Router architecture.
-   User authentication or state persistence beyond the current session.

## Architecture

### Frontend Surface Updates

-   `components/site/`: Update header and footer for minimal, control-plane appearance.
-   `components/ui/`: Update primitive components (buttons, inputs, tabs) to match the dark theme and new design system.
-   `components/workflow/`: Introduce new components for the split-pane layout, workflow progress rail, and segmented output views.

### Design System

-   **Backgrounds:** Deep dark hues (`#0A0A0A` to `#121212`).
-   **Primary Accents:** Terraform Purple (`#844FBA`) and AI Cyan (`#00E5FF`).
-   **Semantic Colors:** Emerald/Neon Green (Success), Crimson/Rose (Warning/Error).
-   **Typography:** Modern geometric sans-serif (e.g., `Inter`) for UI; premium monospace (e.g., `JetBrains Mono`) for code and logs.

## Verification Strategy

Frontend verification baseline:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:browser
```

Visual regression and responsiveness must be tested manually or via browser tests to ensure the split-pane layout functions correctly on standard desktop resolutions used for demos.

## Sprint Plan

### Sprint 0: Design System & Theming Foundation
Establish the color palette, typography, and foundational CSS/Tailwind configuration for the premium dark theme.

### Sprint 1: Layout & Shell Structure
Implement the two-column split-pane workspace, updating the main layout, header, and footer to match the control-plane aesthetic.

### Sprint 2: Workflow Components
Refactor the prompt input to the sticky left pane and build the tabbed/segmented output workspace for the right pane, including the workflow progress rail.

### Sprint 3: QA & Polish
Apply micro-animations, review hover states, fix any layout bugs, and ensure the UI feels responsive and premium. Add a QA pass document.

## Acceptance Criteria

The `ui-redesign` workstream is complete when:
-   The application defaults to the specified premium dark theme.
-   The main interface uses a split-pane layout with the prompt on the left and output on the right.
-   A workflow progress rail clearly indicates the current stage of the pipeline.
-   Output data is organized into readable tabs or segments.
-   Micro-animations enhance the AI interaction and state changes.
-   All existing frontend tests pass, and new tests cover the layout changes.
-   A separate QA sprint confirms visual polish and functionality.
