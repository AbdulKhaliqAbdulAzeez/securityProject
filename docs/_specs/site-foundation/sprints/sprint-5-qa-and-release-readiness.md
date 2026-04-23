# Sprint 5: QA And Release Readiness

## Goal

Run a separate QA pass across the site-foundation workstream and repair any
remaining mismatches between the spec, sprint docs, and live implementation.

## Governing Spec Sections

- all sections in `spec.md`

## Verified Available Assets

- `docs/_specs/site-foundation/spec.md`
- all prior sprint docs in this folder
- live code, tests, and root docs

## Artifact Targets

- any file that requires a targeted QA repair
- QA notes recorded from this pass

## Tasks

1. read the spec and each sprint doc in order
2. inspect every changed file against the documented requirements
3. rerun the repository verification commands
4. repair any verified defects without widening scope
5. record the outcome and any resolved deviations

## Verify

```bash
ruff format --check .
ruff check .
pytest
```

Manual checks:

```bash
streamlit run app.py
```

If Terraform is installed locally, also confirm the validation loop works with a
sample prompt.

## Completion Checklist

- the repository matches the spec and sprint docs
- verification evidence exists for the current state
- QA fixes are applied and re-verified
- no unresolved scope drift remains in the workstream

## QA Deviations

- use this section to record any verified mismatch and the repair applied
