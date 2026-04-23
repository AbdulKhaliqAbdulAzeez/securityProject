# Sprint 4: Security And Reliability Hardening

## Goal

Harden the MVP around secret handling, invalid input, timeout behavior, and the
explicit no-deploy safety boundary.

## Governing Spec Sections

- Safety And Security Requirements
- UX Requirements
- Acceptance Criteria

## Verified Available Assets

- root `.gitignore`
- `app.py`
- `ai_generator.py`
- `tf_validator.py`
- `docs/foundation/professional-development-rules.md`

## Artifact Targets

- `app.py`
- `ai_generator.py`
- `tf_validator.py`
- `.gitignore`
- relevant docs if behavior changes

## Tasks

1. tighten handling around empty prompts and invalid local setup
2. confirm secrets are sourced from environment or Streamlit secrets only
3. confirm validation commands do not widen into apply or destroy behavior
4. ensure timeout and failure paths return readable logs
5. expand tests for the hardened paths that can be verified locally

## Verify

```bash
ruff check .
pytest
```

Manual smoke test:

```bash
streamlit run app.py
```

## Completion Checklist

- no deploy behavior exists in the MVP
- failure paths stay readable
- no secrets or Terraform state are introduced to source control
- tests and docs match the hardened behavior

## QA Deviations

- none recorded yet
