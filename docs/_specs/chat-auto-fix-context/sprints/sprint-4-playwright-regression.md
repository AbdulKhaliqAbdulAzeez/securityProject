# Sprint 4: Playwright Regression

## Goal

Verify the complete browser workflow for a blocked security check followed by
the improved auto-fix action.

## Governing Spec Sections

- User Experience
- Acceptance Criteria

## Verified Available Assets

- `tests/browser/homepage-smoke.spec.ts` already covers auto-fix through chat.
- `package.json` provides `npm run test:browser`.

## Artifact Targets

- `tests/browser/homepage-smoke.spec.ts`

## Tasks

1. Update the auto-fix browser test to assert descriptive visible text.
2. Assert the raw command `fix` is not displayed as the user action bubble.
3. Assert `/api/fix` receives hidden Checkov context and metadata.
4. Run Playwright and repair regressions until the scenario passes.

## Verify

```bash
npm run test:browser
```

## Completion Checklist

- [ ] The auto-fix browser flow passes.
- [ ] The visible chat text matches the spec.
- [ ] The hidden fix request includes Checkov context.
