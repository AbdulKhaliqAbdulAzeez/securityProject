# Sprint 3: Shift-Left Security Scanning

## Goal

Integrate Checkov into the backend validation loop and block the ready state
when infrastructure security findings are present.

## Governing Spec Sections

- Primary Design Goals
- Architecture
- Safety And Security Requirements
- UX Requirements

## Verified Available Assets

- the backend Terraform validation workflow from Sprint 2
- the temporary-workspace model already used for Terraform validation
- the frontend readiness and feedback states from Sprint 1 and Sprint 2

## Artifact Targets

- `backend/tf_validator.py` or a dedicated backend security-scanning helper if
  the implementation needs one
- the Python API entrypoint and response schema
- `components/workflow/` and related frontend state helpers
- backend and frontend tests
- `README.md` if Checkov becomes a documented local prerequisite

## Tasks

1. run `checkov -d <temporary_terraform_directory>` through `subprocess` after
   Terraform validation succeeds
2. capture Checkov exit codes, stdout, stderr, and blocking findings in a
   stable backend result shape
3. mark the Terraform document as not ready whenever Checkov reports security
   violations
4. present the specific Checkov warnings in the frontend so the user can see
   why the code was rejected
5. add tests for successful scans, blocking findings, and missing-Checkov
   failure handling

## Verify

```bash
ruff format --check .
ruff check .
pytest
npm run typecheck
npm run lint
npm run test
```

Optional local prerequisite check:

```bash
checkov --version
```

## Completion Checklist

- Checkov runs against the same temporary Terraform workspace used for
  validation
- security findings block the ready-to-deploy state
- the frontend shows specific Checkov warnings instead of a generic rejection
- missing local Checkov setup fails clearly

## QA Deviations

- none recorded yet