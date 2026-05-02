# Sprint 4: Final QA Gate

## Goal

Run and record the final release confidence suite after Ruff cleanup, Checkov
parser hardening, and worktree triage.

## Governing Spec Sections

- QA Snapshot
- Acceptance Criteria

## Verified Available Assets

- `package.json` exposes TypeScript, lint, unit, and browser checks.
- `pyproject.toml` exposes Python test and Ruff config.
- Terraform and Checkov are installed locally.

## Artifact Targets

- `docs/_specs/project-qa-hardening/final-qa-pass.md`

## Tasks

1. Run the full frontend QA suite.
2. Run the full Python QA suite.
3. Run Ruff check and format checks.
4. Run Playwright.
5. Record command outputs, tool versions, pass/fail status, and residual risks.

## Verify

```bash
npm run typecheck
npm run lint
npm test
.venv/bin/pytest
.venv/bin/python -m ruff check .
.venv/bin/python -m ruff format --check .
npm run test:browser
```

## Completion Checklist

- [ ] All listed commands pass.
- [ ] Final QA pass doc exists.
- [ ] Residual risks are explicitly documented.
- [ ] The project is ready for final review or submission.

## QA Deviations

- Record any command that cannot be run locally and why.
