# Sprint 4: Ready Path Playwright Verification

## Goal

Verify that a secure suggested prompt can produce a ready workflow path in the
chat without requiring auto-fix.

## Governing Spec Sections

- UX Requirements
- Test Requirements
- Acceptance Criteria

## Verified Available Assets

- `tests/browser/homepage-smoke.spec.ts` already mocks workflow, fix, deploy,
  and reset paths.
- Playwright starts the Next.js dev server on `127.0.0.1:3100`.

## Artifact Targets

- `tests/browser/homepage-smoke.spec.ts`
- `tests/browser/chat-smoke.spec.ts` if empty-state suggestion coverage belongs
  there instead

## Tasks

1. Add a browser test that clicks a secure suggestion.
2. Submit the populated prompt.
3. Mock `/api/workflow` with validation passed, Checkov passed, readiness ready.
4. Assert the readiness card shows `Deploy to GitHub`.
5. Assert `Auto-Fix Issues` is not visible for the ready path.
6. Keep the existing blocked auto-fix browser test to prove recovery still works.

## Verify

```bash
npm run test:browser
```

## Completion Checklist

- [ ] Secure suggestion chips render in the browser.
- [ ] A secure suggestion can drive a ready mocked workflow.
- [ ] Ready path does not ask the user to auto-fix.
- [ ] Existing blocked auto-fix path still passes.

## QA Deviations

- Record any UI text or selector changes required for reliable browser testing.

