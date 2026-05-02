# Sprint 2: Checkov Fail-Closed Parser

## Goal

Prevent malformed or unexpected Checkov output from being treated as a passing
security scan.

## Governing Spec Sections

- Finding 2: Checkov Parser Can Overtrust Malformed Output
- Acceptance Criteria

## Verified Available Assets

- `backend/tf_validator.py` owns Checkov execution and parsing.
- `tests/python/test_tf_validator.py` already covers pass, fail, missing
  Checkov, and venv Checkov discovery.
- Checkov `3.2.525` is available locally.

## Artifact Targets

- `backend/tf_validator.py`
- `tests/python/test_tf_validator.py`
- `tests/python/test_api.py` if response behavior changes

## Tasks

1. Replace `_extract_checkov_findings(stdout: str) -> list[SecurityFinding]`
   with a parser result that distinguishes:
   - valid parse with zero findings
   - valid parse with failed checks
   - invalid JSON
   - unexpected schema
2. Update `_run_checkov_scan` so only valid parsed output with zero failed
   checks and exit code `0` can return `passed`.
3. Preserve `failed` when any failed checks are parsed, regardless of exit code.
4. Return `scan_error` for invalid JSON, missing `results`, non-list
   `failed_checks`, timeout output, or any inconclusive scanner output.
5. Add tests for:
   - invalid JSON with exit code `0`
   - missing `results` with exit code `0`
   - non-list `failed_checks` with exit code `0`
   - valid empty failed checks with exit code `0`
   - valid failed checks with exit code `1`

## Verify

```bash
.venv/bin/pytest tests/python/test_tf_validator.py tests/python/test_api.py
```

## Completion Checklist

- [ ] Malformed Checkov output returns `scan_error`.
- [ ] Valid empty Checkov output returns `passed`.
- [ ] Valid failed checks return `failed`.
- [ ] Readiness remains blocked for `scan_error`.
- [ ] Tests cover parser edge cases.

## QA Deviations

- Record any real Checkov output shape that requires parser compatibility logic.

