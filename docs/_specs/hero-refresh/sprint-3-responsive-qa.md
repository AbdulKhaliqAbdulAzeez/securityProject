# Sprint 3: Responsive QA And Polish

## Goal

Confirm the hero works across desktop, mobile, and workflow states.

## Governing Spec Sections

- UX Contract
- Verification

## Verified Available Assets

- Browser smoke tests already cover the root chat page.
- `npm run test:browser` runs Playwright checks.

## Artifact Targets

- `tests/browser/chat-smoke.spec.ts`
- `tests/browser/homepage-smoke.spec.ts`
- `app/globals.css`

## Tasks

1. Add browser coverage for hero visibility and CTA behavior.
2. Confirm a sent prompt transitions to the normal conversation view.
3. Check mobile breakpoints for text fit and input reachability.
4. Record any QA deviation in this sprint document.

## Verify

```bash
npm run build
npm run test:browser
```

## Completion Checklist

- Hero is visible at first load.
- Prompt focus and fill work in browser tests.
- Workflow cards remain visible after a prompt is submitted.
- Mobile layout does not overlap hero text, input, or chat messages.
