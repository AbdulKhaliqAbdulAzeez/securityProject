# Sprint 3: Worktree and Release Triage

## Goal

Separate intentional project changes from local/generated artifacts so the
release diff is reviewable.

## Governing Spec Sections

- Finding 3: Dirty Worktree Needs Release Triage
- Acceptance Criteria

## Verified Available Assets

- `git status --short` shows many modified and untracked files.
- `.codex` and `.playwright-mcp/` appear to be local tooling artifacts.
- Recent feature docs live under:
  - `docs/_specs/chat-auto-fix-context/`
  - `docs/_specs/secure-suggested-prompts/`
  - `docs/_specs/project-qa-hardening/`

## Artifact Targets

- `.gitignore`
- release notes or QA notes under `docs/_specs/project-qa-hardening/`
- no application files unless triage discovers accidental changes

## Tasks

1. Review `git status --short` and classify files into:
   - intentional feature code
   - intentional tests
   - intentional docs/specs
   - generated/local artifacts
   - unrelated or stale edits
2. Add generated/local artifacts to `.gitignore` if they should never be
   committed.
3. Confirm whether root helper scripts are still needed.
4. Produce a release checklist with exact files expected in the final diff.
5. Re-run QA after any ignore or cleanup changes.

## Verify

```bash
git status --short
npm run typecheck
npm test
.venv/bin/pytest
npm run test:browser
```

## Completion Checklist

- [ ] Local artifacts are ignored or explicitly kept out of release.
- [ ] Intentional code/test/docs changes are easy to review.
- [ ] No stale helper scripts are accidentally included.
- [ ] QA still passes after triage.

## QA Deviations

- Record any file whose ownership or purpose is unclear.

