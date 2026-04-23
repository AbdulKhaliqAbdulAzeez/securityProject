# Sprint 2 QA Pass

## Scope

QA review of `docs/_specs/nextjs-platform-transition/spec.md` and
`docs/_specs/nextjs-platform-transition/sprints/sprint-2-python-api-bridge.md`
against the live Sprint 2 implementation.

## Files Reviewed

- `README.md`
- `requirements.txt`
- `backend/__init__.py`
- `backend/ai_generator.py`
- `backend/api.py`
- `components/site/site-header.tsx`
- `components/site/site-footer.tsx`
- `components/workflow/workflow-shell.tsx`
- `app/api/workflow/route.ts`
- `app/globals.css`
- `lib/site.ts`
- `lib/workflow.ts`
- `lib/workflow-api.ts`
- `tests/app/home-page.test.tsx`
- `tests/browser/homepage-smoke.spec.ts`
- `tests/python/test_ai_generator.py`
- `tests/python/test_api.py`

## Checks Run

```bash
ruff format --check .
ruff check .
pytest
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:browser
python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
npm run dev -- --port 3100
```

## Findings

- The Sprint 2 implementation now exposes a stable Python workflow contract for
  prompt submission, generation metadata, Terraform output, validation logs, and
  readiness state.
- The Next.js workflow shell now calls the live backend through
  `app/api/workflow`, maps success, validation failure, and transport failure
  states into readable UI regions, and preserves the disabled deploy boundary.
- Backend coverage now includes explicit contract tests for blank prompts,
  successful workflow responses, and validation-failure payloads.
- Frontend coverage now checks live-response mapping instead of the old preview
  model, and the browser smoke test exercises the post-transport workflow path.
- The manual live smoke passed against the running Next.js app and Python API:
  the frontend submitted the sample prompt, the backend returned live
  Gemini-generated Terraform through the Python API bridge, Terraform
  validation passed, and readiness remained blocked pending the future security
  gate.

## Fixes Applied

- Applied Ruff formatting and lint repairs that surfaced during QA on the new
  backend API and backend API tests.
- Replaced the deprecated Gemini client path with the official `google-genai`
  SDK and normalized `gemini-3-flash` to the live
  `gemini-3-flash-preview` runtime alias exposed by the current API key.
- Tightened repeated-text assertions in both Vitest and Playwright so QA targets
  the intended workflow regions instead of failing on duplicate status and
  feedback messages.
- Updated stale site header and footer copy that still announced Sprint 1 even
  after the Sprint 2 Python API bridge was live.

## Final Result

- PASS with resolved issues listed above