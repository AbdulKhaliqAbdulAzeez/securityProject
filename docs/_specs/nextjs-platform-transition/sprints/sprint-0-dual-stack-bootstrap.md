# Sprint 0: Dual-Stack Bootstrap

## Goal

Create the repository structure and quality tooling required to host a root
Next.js application while preserving the current Python implementation as a
separate backend surface.

## Governing Spec Sections

- Problem Statement
- Scope
- Architecture
- Verification Strategy

## Verified Available Assets

- the current Python MVP entrypoints at the repository root, including
  `app.py`, `ai_generator.py`, and `tf_validator.py`
- the current flat pytest layout under `tests/`
- the local reference repository under
  `docs/_nextjs_ai_orchestration_reference/nextjs_ai_orchestration_spec_sprint_process/`
- the existing durable docs and sprint templates under `docs/`

## Artifact Targets

- root Node.js and Next.js manifests such as `package.json`, `tsconfig.json`,
  `next.config.ts`, and frontend lint or formatting configuration
- the new root-level `app/`, `components/`, `lib/`, `public/`, and frontend
  test directories
- the relocated Python backend surface under `backend/`
- updated Python test locations under `tests/python/`
- `README.md` if local setup or verification commands change during the
  bootstrap

## Tasks

1. relocate the current root Python application surfaces so the repository can
   create a root `app/` directory without naming conflicts
2. restructure the test layout so frontend and backend tests can coexist under
   a reference-aligned hierarchy
3. scaffold a Next.js 16 App Router workspace with TypeScript and baseline
   quality scripts
4. establish the reference-inspired directory split across `components/site/`,
   `components/ui/`, and `components/workflow/`
5. document the dual Node.js and Python local development contract

## Verify

```bash
npm run typecheck
npm run lint
npm run test
npm run build
ruff format --check .
ruff check .
pytest
```

## Completion Checklist

- the repository can host a root-level Next.js `app/` directory cleanly
- the Python code has a dedicated backend location
- frontend and backend tests no longer compete for the same flat directory
- baseline Node.js quality commands are defined and runnable
- the bootstrap docs describe the new repository layout accurately

## QA Deviations

- none recorded yet