# Sprint 4 QA Pass

## Scope

QA review of `docs/_specs/site-foundation/spec.md` and
`docs/_specs/site-foundation/sprints/sprint-4-security-and-reliability-hardening.md`
against the live Sprint 4 implementation.

## Files Reviewed

- `docs/_specs/site-foundation/spec.md`
- `docs/_specs/site-foundation/sprints/sprint-4-security-and-reliability-hardening.md`
- `app.py`
- `tests/test_app.py`
- `tf_validator.py`
- `tests/test_tf_validator.py`
- `.gitignore`

## Checks Run

```bash
.venv/bin/ruff check .
.venv/bin/pytest
.venv/bin/streamlit run app.py --server.headless true --server.port 8501
rg --glob '*.py' 'apply|destroy'
```

Manual QA observations from the headless Streamlit smoke test:

- the app launched successfully and served the UI on `http://localhost:8501`
- the page rendered one infrastructure prompt box, one primary `Generate and validate` action, and the side-by-side output panels
- a real submission displayed fallback Terraform output and a readable Terraform CLI error state when `terraform` was unavailable on `PATH`
- the UI did not expose raw exception messages during the verified failure path

## Findings

- No verified mismatches were found between the Sprint 4 contract and the live
  hardening implementation.
- The validator stops after the first non-zero Terraform result, including
  timeout cases, which keeps failure output readable and bounded to the
  validate-only workflow.
- The no-deploy audit found only the user-facing guardrail text in `app.py` and
  the explicit guardrail assertion in `tests/test_tf_validator.py`; no runtime
  `apply` or `destroy` behavior exists in the MVP.
- `.gitignore` continues to exclude environment files, Streamlit secrets,
  Terraform state, and local working directories from source control.

## Fixes Applied

- No fixes were required during this QA pass.

## Final Result

- PASS (0 issues)