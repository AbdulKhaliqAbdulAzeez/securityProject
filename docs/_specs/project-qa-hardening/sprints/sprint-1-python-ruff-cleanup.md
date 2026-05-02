# Sprint 1: Python Ruff Cleanup

## Goal

Make Python lint and format checks pass without changing application behavior.

## Governing Spec Sections

- Finding 1: Python Ruff Compliance Blocks Release QA
- Acceptance Criteria

## Verified Available Assets

- `pyproject.toml` configures Ruff line length at 88.
- `.venv/bin/python -m ruff check .` currently fails.
- `.venv/bin/python -m ruff format --check .` currently fails.
- Runtime tests pass, so this sprint should be behavior-neutral.

## Artifact Targets

- `backend/api.py`
- `backend/ai_generator.py`
- `fix_tests.py`
- `modify_css.py`
- `update_layout_css.py`
- `pyproject.toml` only if helper scripts should be intentionally excluded

## Tasks

1. Sort imports in `backend/api.py`.
2. Wrap the long model-name line in `backend/ai_generator.py`.
3. Decide whether root helper scripts are maintained source files or one-off
   local scripts.
4. If maintained, format and lint-fix:
   - `fix_tests.py`
   - `modify_css.py`
   - `update_layout_css.py`
5. If not maintained, move them under an ignored scratch/tools area or exclude
   them explicitly in `pyproject.toml` with a short comment.
6. Run Ruff check and format verification.

## Verify

```bash
.venv/bin/python -m ruff check .
.venv/bin/python -m ruff format --check .
.venv/bin/pytest
```

## Completion Checklist

- [ ] Ruff check passes.
- [ ] Ruff format check passes.
- [ ] Python tests still pass.
- [ ] Any excluded helper scripts are intentionally documented.

## QA Deviations

- Record any helper script that is deleted, moved, or excluded.

