# Sprint 0 QA Pass

## Scope

QA review of `docs/_specs/nextjs-platform-transition/spec.md` and
`docs/_specs/nextjs-platform-transition/sprints/sprint-0-dual-stack-bootstrap.md`
against the live Sprint 0 implementation.

## Files Reviewed

- `docs/_specs/nextjs-platform-transition/spec.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-0-dual-stack-bootstrap.md`
- `.gitignore`
- `.env.example`
- `README.md`
- `agent.md`
- `pyproject.toml`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- `next-env.d.ts`
- `eslint.config.mjs`
- `vitest.config.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `backend/__init__.py`
- `backend/ai_generator.py`
- `backend/streamlit_app.py`
- `backend/tf_validator.py`
- `components/site/site-header.tsx`
- `components/site/site-footer.tsx`
- `components/ui/status-chip.tsx`
- `components/workflow/workflow-shell.tsx`
- `lib/site.ts`
- `lib/workflow.ts`
- `tests/app/home-page.test.tsx`
- `tests/browser/README.md`
- `tests/python/conftest.py`
- `tests/python/test_ai_generator.py`
- `tests/python/test_streamlit_app.py`
- `tests/python/test_tf_validator.py`
- `tests/setup.ts`

## Checks Run

```bash
npm --version
npx --version
node --version
npm install
npm run typecheck
npm run lint
npm run test
npm run build
/home/kepler/Documents/Spring2026/IS219/securityProject/.venv/bin/python -m ruff format --check .
/home/kepler/Documents/Spring2026/IS219/securityProject/.venv/bin/python -m ruff check .
/home/kepler/Documents/Spring2026/IS219/securityProject/.venv/bin/python -m pytest
git check-ignore -v tsconfig.tsbuildinfo
```

## Findings

- Initial root TypeScript scope incorrectly included
  `docs/_nextjs_ai_orchestration_reference/`, which caused `npm run typecheck`
  to fail with 281 errors from the local reference repository rather than the
  Sprint 0 workspace.
- Initial ESLint scope traversed `.venv/`, which caused `npm run lint` to scan
  Streamlit's vendored JavaScript bundle and abort with a Node heap out of
  memory failure.
- Initial frontend test typing relied on undeclared globals, which left the new
  Vitest-backed test surface incomplete under strict TypeScript checks.
- Initial verification left `tsconfig.tsbuildinfo` as an untracked generated
  artifact, so the bootstrap did not yet fully contain its own tool outputs.

## Fixes Applied

- Excluded `docs/_nextjs_ai_orchestration_reference/**/*` and
  `docs/_project_idea/**/*` from the root `tsconfig.json` so the root frontend
  workspace typechecks only the Sprint 0 application surface.
- Added path-specific ESLint ignores for `.venv/`,
  `docs/_nextjs_ai_orchestration_reference/`, and `docs/_project_idea/` so lint
  remains scoped to repository source files.
- Added explicit `describe`, `expect`, and `it` imports in
  `tests/app/home-page.test.tsx` so the frontend test is valid under strict
  TypeScript.
- Added `*.tsbuildinfo` to `.gitignore` so TypeScript incremental metadata does
  not leak into the working tree during normal verification.

## Final Result

- PASS with resolved issues listed above