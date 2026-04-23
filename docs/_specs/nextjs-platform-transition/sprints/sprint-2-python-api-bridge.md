# Sprint 2: Python API Bridge

## Goal

Expose Terraform generation and validation through a stable Python backend API
that the Next.js frontend can call directly.

## Governing Spec Sections

- Scope
- Architecture
- Safety And Security Requirements
- Verification Strategy

## Verified Available Assets

- the relocated backend modules from Sprint 0
- the live generation logic currently owned by `ai_generator.py`
- the live Terraform validation logic currently owned by `tf_validator.py`
- the frontend workflow state model established in Sprint 1

## Artifact Targets

- the Python API entrypoint for workflow requests
- `backend/ai_generator.py`
- `backend/tf_validator.py`
- frontend API helpers under `lib/`
- any route handlers, actions, or fetch wrappers needed by the Next.js app
- backend and frontend integration tests

## Tasks

1. define a stable request and response contract for prompt submission,
   generated code, Terraform validation logs, and readiness status
2. expose a Python HTTP endpoint that composes the existing generation and
   validation modules without duplicating their logic in TypeScript
3. connect the Next.js workflow page to the backend contract and map backend
   failures into readable UI states
4. preserve existing no-deploy boundaries while the frontend transport changes
5. add tests for contract stability, success paths, and backend failure mapping

## Verify

```bash
ruff format --check .
ruff check .
pytest
npm run typecheck
npm run lint
npm run test
```

Manual smoke test once the backend service exists:

```bash
npm run dev
```

Run the backend service in a second terminal with the command defined during
implementation.

## Completion Checklist

- the Next.js frontend can call the Python backend successfully
- the API response shape is explicit and test-covered
- generation and Terraform validation behavior are preserved through the new
  transport layer
- backend errors remain readable in the UI

## QA Deviations

- none recorded yet