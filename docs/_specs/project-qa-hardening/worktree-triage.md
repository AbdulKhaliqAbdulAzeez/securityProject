# Worktree Triage

## Date

May 2, 2026

## Local Artifacts Ignored

- `.codex`
- `.playwright-mcp/`

These are local tool artifacts and should not be included in release commits.

## Intentional Project Changes Present

Feature and QA hardening work is currently spread across:

- chat auto-fix context improvements
- secure suggested prompt planning docs
- project QA hardening docs
- Checkov parser fail-closed hardening
- Python Ruff cleanup

## Helper Scripts

The root helper scripts below are treated as one-off maintenance scripts and
are excluded from Ruff in `pyproject.toml`:

- `fix_tests.py`
- `modify_css.py`
- `update_layout_css.py`

They are not part of the runtime application path.

## Release Guidance

Before final submission, review `git status --short` and keep commits grouped
by purpose:

1. Chat auto-fix feature code and tests.
2. Secure prompt and QA planning docs.
3. QA hardening code, tests, and docs.
4. Existing UI/doc work that predates QA hardening.
