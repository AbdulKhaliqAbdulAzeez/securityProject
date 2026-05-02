# Project QA Hardening Plan

## Summary

This plan captures the QA findings from the current project review and turns
them into concrete follow-up work. The application is functionally passing
TypeScript, ESLint, unit tests, Python tests, and Playwright, but there are
release-quality issues that should be fixed before treating the project as
ready.

## QA Snapshot

Review date: May 2, 2026

Commands run:

```bash
npm run typecheck
npm run lint
npm test
.venv/bin/pytest
.venv/bin/python -m ruff check .
.venv/bin/python -m ruff format --check .
npm run test:browser
```

Passing checks:

- `npm run typecheck`
- `npm run lint`
- `npm test` - 17 tests passed
- `.venv/bin/pytest` - 44 tests passed
- `npm run test:browser` - 5 tests passed

Failing checks:

- `.venv/bin/python -m ruff check .`
- `.venv/bin/python -m ruff format --check .`

Local tool availability:

- Terraform: `1.14.9`
- Checkov: `3.2.525`

## Findings

### 1. Python Ruff Compliance Blocks Release QA

Core backend issues:

- `backend/api.py`: import block is not sorted.
- `backend/ai_generator.py`: one line exceeds the configured 88-character
  limit.

Root helper scripts also fail Ruff:

- `fix_tests.py`
- `modify_css.py`
- `update_layout_css.py`

These helper scripts appear to be one-off maintenance scripts rather than
runtime application code, but they are still included by the current Ruff
project-wide command.

### 2. Checkov Parser Can Overtrust Malformed Output

Current behavior:

- `backend/tf_validator.py` parses Checkov JSON in `_extract_checkov_findings`.
- Invalid JSON, missing `results`, or malformed `failed_checks` currently
  returns an empty findings list.
- `_run_checkov_scan` treats Checkov exit code `0` plus empty findings as
  `passed`.

Risk:

- If Checkov exits `0` but returns malformed or unexpected JSON, the app could
  incorrectly mark the security scan as passed.

Expected behavior:

- Valid Checkov JSON with no failed checks should pass.
- Valid Checkov JSON with failed checks should fail.
- Invalid or unexpected Checkov output should return `scan_error` and block
  readiness.

### 3. Dirty Worktree Needs Release Triage

The current worktree includes many modified and untracked files from recent
feature/spec work plus local/generated files.

Known untracked local/tooling paths:

- `.codex`
- `.playwright-mcp/`

Release risk:

- It is easy to accidentally commit local tool artifacts or mix unrelated UI,
  docs, and feature changes in one commit.

## Goals

- Make Python Ruff checks pass or explicitly scope them to runtime/test code.
- Make Checkov parsing fail closed on malformed scanner output.
- Add tests for malformed Checkov output and scanner reliability states.
- Document or ignore local generated artifacts.
- Produce a clean release checklist that can be run before final submission.

## Non-Goals

- Do not weaken the validation or security gates.
- Do not remove Checkov from the workflow.
- Do not hide scanner setup failures.
- Do not rewrite unrelated UI or docs during QA cleanup.
- Do not run Terraform apply or touch live AWS resources.

## Acceptance Criteria

- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm test` passes.
- `.venv/bin/pytest` passes.
- `.venv/bin/python -m ruff check .` passes or the Ruff include/exclude policy
  is intentionally updated and documented.
- `.venv/bin/python -m ruff format --check .` passes.
- `npm run test:browser` passes.
- Malformed Checkov output cannot produce `security.status === "passed"`.
- Local generated artifacts are excluded from release commits.

