# Sprint 3: Playwright And QA

## Goal

Configure Playwright for the project dev port and cover the hero-to-chat scroll experience.

## Governing Spec Sections

- Verification

## Verified Available Assets

- `npm run dev` starts Next.js on port `3003`.
- Browser tests already cover workflow cards, reset, and auto-fix.

## Artifact Targets

- `playwright.config.ts`
- `tests/browser/chat-smoke.spec.ts`
- `tests/browser/homepage-smoke.spec.ts`

## Tasks

1. Point Playwright `baseURL` and `webServer.url` at `127.0.0.1:3003`.
2. Reuse an existing local dev server outside CI.
3. Add browser assertions for hero position, chat section position, CTA scroll/focus, and post-send chat ownership.
4. Re-run full verification.

## Verify

```bash
npm run build
npm run test:browser
```

## Completion Checklist

- Playwright starts or reuses the expected dev server.
- Browser tests prove chat begins below the hero and fills the viewport after scroll.
