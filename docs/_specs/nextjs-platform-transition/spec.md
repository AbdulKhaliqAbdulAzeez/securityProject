# Next.js Platform Transition Specification

## Status

Complete

## Problem Statement

The current MVP proves the Terraform generation and validation loop, but the
user-facing surface is still a single-file Streamlit app. That was the right
bootstrap choice, but it is not the right long-term frontend stack for a more
structured application.

The repository now needs a deliberate transition to a Next.js frontend that:

- follows the repository structure discipline demonstrated in the local
  Next.js reference project
- frees the root `app/` and `tests/` paths that are currently blocked by
  `app.py` and the flat Python test layout
- keeps the existing Python workflow logic as the backend execution surface
- expands the validation loop to include shift-left security scanning through
  Checkov
- adds a GitOps handoff that opens a GitHub pull request instead of leaving
  validated Terraform on the local machine

## Product Thesis

The next stage of this project should show that a disciplined AI-assisted IaC
workflow can graduate from a bootstrap UI into a componentized web application
without discarding the verified Python core or weakening the safety model.

## Primary Design Goals

1. replace Streamlit as the primary frontend with a structured Next.js
   application
2. preserve the current Python generation and validation logic behind a clearer
   backend service boundary
3. make security review a first-class gate by blocking readiness on Checkov
   findings
4. turn validated Terraform into a reviewable GitHub pull request instead of a
   local dead end
5. keep secrets, no-deploy guardrails, and auditable verification intact during
   the transition

## Scope

### In Scope

- repository restructuring needed to adopt a root-level Next.js application
  layout inspired by the local reference repo
- Next.js 16 App Router frontend with TypeScript and a shared component/layout
  structure under `app/`, `components/`, `lib/`, `public/`, and `tests/`
- migration of Python backend code into a dedicated backend surface so the root
  `app/` directory can exist cleanly
- a stable backend API contract between the Next.js frontend and the existing
  Python workflow modules
- Checkov execution through `subprocess` against the temporary Terraform
  workspace before code is considered ready
- UI feedback that exposes Checkov findings clearly when they block readiness
- a new `gitops_manager.py` module using PyGithub to create a branch, commit
  `main.tf`, and open a pull request
- a Next.js `Deploy to GitHub` action that returns the new pull-request URL
- updated verification and setup documentation for a dual Node.js and Python
  development environment

### Out Of Scope

- `terraform apply`, `terraform destroy`, or any automatic infrastructure
  deployment path
- automatic merge, auto-approval, or direct pushes to the default branch
- GitHub OAuth or user-specific login flows
- multi-cloud generation or provider abstraction beyond the current AWS-first
  scope
- replacing the existing Python generation and validation logic with TypeScript
- hosted deployment for either the Next.js frontend or the Python backend

## Architecture

### Repository Structure Alignment

The Next.js transition should use the reference repository as a structural model
without copying its content-specific surfaces directly.

Target top-level application structure:

- `app/` for the Next.js App Router pages, layouts, and route handlers
- `components/site/` for shell-level layout pieces
- `components/ui/` for reusable interface primitives
- `components/workflow/` for Terraform-specific product components
- `lib/` for shared types, API helpers, configuration, and view-model logic
- `public/` for static assets
- `tests/app/` for frontend unit and component tests
- `tests/browser/` for end-to-end browser checks
- `tests/python/` for pytest-backed backend tests after the Python test layout
  is relocated

The current root-level `app.py` file blocks creation of a root `app/`
directory, and the current flat `tests/` layout conflicts with the reference
test structure. The transition therefore requires an explicit repository
reorganization rather than just adding a second frontend beside Streamlit.

### Backend Surface

- `backend/ai_generator.py` owns Terraform generation
- `backend/tf_validator.py` owns Terraform formatting, validation, and Checkov
  security scanning
- `backend/gitops_manager.py` owns GitHub branch, commit, and pull-request
  creation
- a dedicated Python API entrypoint owns the HTTP contract consumed by Next.js

### Frontend Surface

- the primary workflow page owns prompt submission, status display, readiness
  state, and deploy actions
- frontend state must distinguish generation failure, Terraform validation
  failure, Checkov failure, and GitOps failure
- the `Deploy to GitHub` control must remain disabled until Terraform
  validation and Checkov both succeed

### Documentation Surface

- `README.md` remains the landing document
- `agent.md` remains the entry document for future agents
- `docs/_specs/nextjs-platform-transition/` stores the governing spec and
  sprint contracts for this workstream

## Safety And Security Requirements

- generated Terraform remains untrusted until both `terraform validate` and
  Checkov complete successfully
- Checkov findings must block the ready-to-deploy state and remain visible in
  the UI
- GitHub tokens, repository identifiers, and other credentials must remain on
  the server side through environment variables or equivalent local secrets
- the application must never push directly to the default branch as part of the
  GitOps flow
- the application must never add `terraform apply` or `terraform destroy`
- temporary Terraform workspaces must remain disposable and local only
- logs must stay readable without exposing secret values

## UX Requirements

- one primary workflow page for prompt input and execution
- visible status steps for generation, Terraform validation, and Checkov
  scanning
- generated Terraform displayed in a dedicated code panel
- Terraform and Checkov output displayed in readable, distinct feedback areas
- a clearly disabled `Deploy to GitHub` button until the code is ready
- a visible pull-request URL after successful GitOps delivery
- actionable feedback when Terraform, Checkov, GitHub configuration, or the
  backend service is unavailable

## Verification Strategy

Python verification baseline:

```bash
ruff format --check .
ruff check .
pytest
```

Frontend verification baseline after the Next.js workspace exists:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:browser
```

Sprint-specific verification should call out any local prerequisites such as a
Checkov installation, GitHub token configuration, or a running backend service.

## Sprint Plan

### Sprint 0: Dual-Stack Bootstrap

Create the dual-stack repository scaffold, move the Python surfaces out of the
way of the Next.js root layout, and establish the baseline Node.js toolchain.

### Sprint 1: Next.js Workflow Shell

Build the primary Next.js page, layout, and workflow components that replace
the Streamlit user experience.

### Sprint 2: Python API Bridge

Expose generation and Terraform validation through a stable Python backend API
contract consumed by the Next.js frontend.

### Sprint 3: Shift-Left Security Scanning

Add Checkov to the backend validation loop and surface blocking findings in the
frontend.

### Sprint 4: GitOps Pull Request Delivery

Add the PyGithub-backed branch, commit, and pull-request workflow plus the
frontend deploy action.

### Sprint 5: QA And Release Readiness

Run a separate QA pass across the transition workstream and repair any verified
gaps before the Next.js frontend becomes the documented primary interface.

## Acceptance Criteria

The `nextjs-platform-transition` workstream is complete when:

- the repository uses a reference-aligned Next.js structure at the root
- the current Python workflow code has a dedicated backend surface and no
  longer blocks the Next.js `app/` layout
- a user can submit a prompt from the Next.js UI and receive generated
  Terraform plus validation feedback
- Checkov findings block readiness and are visible in the UI
- the deploy control creates a GitHub pull request and returns its URL
- docs and verification commands describe the new dual-stack setup accurately
- a separate QA sprint confirms the live repository matches the workstream

## Future Considerations

- move long-running validation and GitOps operations into background jobs if
  request latency becomes a problem
- add richer Checkov configuration, suppressions, or policy bundles only after
  the base scan is stable
- add GitHub App authentication or per-user authorization only as a separate
  workstream
- evaluate hosted deployment only after the local Next.js and Python workflow is
  stable end to end