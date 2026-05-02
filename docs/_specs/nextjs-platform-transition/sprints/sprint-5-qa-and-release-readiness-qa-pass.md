# Sprint 5 QA Pass

## Scope

QA review of `docs/_specs/nextjs-platform-transition/spec.md`, the full
`docs/_specs/nextjs-platform-transition/sprints/` sequence, and the live
repository state at the completion of the `nextjs-platform-transition`
workstream.

## Files Reviewed

- `README.md`
- `agent.md`
- `package.json`
- `playwright.config.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/api/workflow/route.ts`
- `app/api/deploy/route.ts`
- `app/globals.css`
- `backend/api.py`
- `backend/gitops_manager.py`
- `backend/tf_validator.py`
- `components/site/site-header.tsx`
- `components/site/site-footer.tsx`
- `components/workflow/workflow-shell.tsx`
- `lib/site.ts`
- `lib/workflow.ts`
- `lib/workflow-api.ts`
- `tests/app/home-page.test.tsx`
- `tests/app/site-frame.test.tsx`
- `tests/browser/README.md`
- `tests/browser/homepage-smoke.spec.ts`
- `tests/python/test_api.py`
- `tests/python/test_gitops_manager.py`
- `docs/_specs/README.md`
- `docs/_specs/nextjs-platform-transition/spec.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-0-dual-stack-bootstrap.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-0-dual-stack-bootstrap-qa-pass.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-1-nextjs-workflow-shell.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-1-nextjs-workflow-shell-qa-pass.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-2-python-api-bridge.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-2-python-api-bridge-qa-pass.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-3-shift-left-security-scanning.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-4-gitops-pull-request-delivery.md`
- `docs/_specs/nextjs-platform-transition/sprints/sprint-5-qa-and-release-readiness.md`

## Checks Run

```bash
/home/kepler/Documents/Spring2026/IS219/securityProject/.venv/bin/python -m ruff format --check .
/home/kepler/Documents/Spring2026/IS219/securityProject/.venv/bin/python -m ruff check .
/home/kepler/Documents/Spring2026/IS219/securityProject/.venv/bin/python -m pytest
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:browser
npm run test -- tests/app/home-page.test.tsx tests/app/site-frame.test.tsx
npm run test:browser -- tests/browser/homepage-smoke.spec.ts
/home/kepler/Documents/Spring2026/IS219/securityProject/.venv/bin/python -m uvicorn backend.api:app --host 127.0.0.1 --port 8000
npm run dev -- --hostname 127.0.0.1 --port 3001
```

Manual QA observations from the live backend and browser smoke checks:

- the backend API launched successfully on `http://127.0.0.1:8000`
- the Next.js dev server launched successfully on `http://127.0.0.1:3001`
  after using a non-conflicting local port because `127.0.0.1:3000` was already
  occupied in this environment
- the live homepage rendered the corrected transition-complete header/footer
  copy, the workflow shell, the prompt composer, the separate Terraform and
  backend feedback panels, and the disabled deploy control before a run
- a live `/workflow` submission from both the browser and direct backend call
  returned `generation_status=succeeded`, `validation_status=passed`,
  `security_status=failed`, and `readiness_status=blocked_by_security`, which
  matches the documented Checkov gate behavior in this environment
- the live browser flow displayed the generated Terraform, validation logs,
  14 blocking Checkov findings, a `Blocked by security` readiness state, and a
  disabled `Deploy to GitHub` control after the sample prompt run
- a direct `/deploy` request with a minimal validation- and Checkov-passing
  Terraform document returned `503` with
  `GITHUB_TOKEN is not configured. Set it before running GitOps delivery.`,
  which matches the documented server-side GitHub configuration guardrail
- a live sandbox pull-request creation was not executed because no safe GitHub
  sandbox configuration was present in this environment

## Findings

- The shared site frame still advertised Sprint 2 and described Checkov and
  GitOps delivery as future work even though the live workflow, tests, and docs
  now expose those features. This was a verified UI contract mismatch.
- The landing documentation still described `tests/browser/` as a reserved
  future surface and omitted `npm run test:browser` from the main verification
  block even though browser coverage is now part of the live verification set.
- The repository status surfaces in `agent.md`, `docs/_specs/README.md`, and
  `docs/_specs/nextjs-platform-transition/spec.md` still described the
  transition workstream as in progress after the Sprint 5 completion pass.
- No verified code or test mismatches remained in the workflow API bridge,
  Checkov gate, deploy readiness gating, or GitOps configuration error path
  after the targeted repair and re-verification.

## Fixes Applied

- updated `components/site/site-header.tsx`, `components/site/site-footer.tsx`,
  and `lib/site.ts` so the shared shell copy now reflects the completed
  Next.js, Checkov, and GitOps workflow
- added `tests/app/site-frame.test.tsx` and updated
  `tests/browser/homepage-smoke.spec.ts` so the shared shell copy regression is
  covered in both app and browser checks
- updated `README.md` to describe the completed transition state, the live
  browser test surface, and the full verification command set
- updated `agent.md`, `docs/_specs/README.md`,
  `docs/_specs/nextjs-platform-transition/spec.md`, and
  `docs/_specs/nextjs-platform-transition/sprints/sprint-5-qa-and-release-readiness.md`
  so the durable program state matches the completed workstream and records the
  resolved QA deviations

## Final Result

- PASS with resolved issues listed above. A live sandbox GitHub pull-request
  creation was not executed because this environment does not provide the
  required safe GitHub configuration, but the documented server-side guardrail
  and automated GitOps coverage both passed.