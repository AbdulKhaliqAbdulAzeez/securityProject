# Commit And Review Guide

## Commit Philosophy

Commits should preserve the story of the work. A reviewer should be able to see
what changed, why it changed, and how it was verified without guessing.

## Commit Types

Use these prefixes:

- `feat:` new user-facing or sprint-defined functionality
- `fix:` bug fixes or QA repairs
- `docs:` documentation updates
- `refactor:` internal cleanup without behavior changes
- `test:` new or updated tests
- `chore:` maintenance or setup work

## Sprint-Aware Commit Examples

- `feat: implement Sprint 1 generator contract`
- `feat: implement Sprint 2 terraform validation workflow`
- `fix: Sprint 5 QA repair validation error handling`
- `docs: add professional development rules`

## Commit Rules

- One logical change per commit.
- Separate implementation commits from QA or cleanup commits when feasible.
- Do not bundle unrelated docs, code, and formatting drift into one commit.
- Stage only the files relevant to the current task.

## Recommended Commit Body For Non-Trivial Work

For non-trivial commits, include a short body with:

1. the governing sprint or change note
2. the key behavior or artifact changed
3. the verification commands run

Example:

```text
feat: implement Sprint 2 terraform validation workflow

- add tempfile-based terraform workspace execution
- capture fmt, init, and validate logs in a stable return shape
- verification: python -m compileall ., pytest
```

## Review Checklist

Before asking for review, confirm:

- the work matches the governing spec or change note
- scope did not widen into adjacent concerns
- secrets and Terraform state were not introduced into source control
- verification evidence exists for the touched slice
- docs were updated when setup or workflow changed

## QA Review Expectations

QA is not a style pass. QA should focus on:

- behavior mismatches
- safety regressions
- missing verification
- inaccurate documentation
- hidden scope drift
