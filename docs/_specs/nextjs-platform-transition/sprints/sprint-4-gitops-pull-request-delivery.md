# Sprint 4: GitOps Pull Request Delivery

## Goal

Add a GitOps deployment path that creates a branch, commits `main.tf`, and
opens a GitHub pull request after Terraform validation and Checkov both pass.

## Governing Spec Sections

- Primary Design Goals
- Scope
- Architecture
- Safety And Security Requirements
- UX Requirements

## Verified Available Assets

- the backend readiness state from Sprint 3
- the frontend deploy control and workflow state from Sprint 1
- the local secret-handling rules already documented in the repository

## Artifact Targets

- `backend/gitops_manager.py`
- the Python API entrypoint for deploy requests
- the Next.js workflow page and related UI components
- backend and frontend tests
- setup documentation for GitHub environment variables or repository settings

## Tasks

1. create `gitops_manager.py` using PyGithub and define a stable function that
   creates a unique branch on the configured repository
2. commit the validated Terraform as `main.tf` on that branch and open a pull
   request against the configured base branch
3. ensure the backend refuses GitOps delivery unless Terraform validation and
   Checkov have both passed
4. wire the `Deploy to GitHub` action in the frontend and display the returned
   pull-request URL on success
5. add tests for GitHub API interactions, branch naming, error handling, and
   UI gating

## Verify

```bash
ruff format --check .
ruff check .
pytest
npm run typecheck
npm run lint
npm run test
```

Manual smoke test once credentials are configured:

```bash
npm run dev
```

Use a test repository or sandbox branch target during manual verification.

## Completion Checklist

- GitOps delivery creates a unique branch instead of mutating the default branch
- validated Terraform is committed as `main.tf`
- a pull-request URL is returned and visible in the UI
- deploy remains blocked until validation and security checks both pass
- secrets remain server-side and never appear in client code or logs

## QA Deviations

- none recorded yet