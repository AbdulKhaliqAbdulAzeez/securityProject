# Sprint 5: QA And Release Readiness

## Goal

Run a separate QA pass across the full Next.js transition workstream and repair
any verified mismatch before the new frontend becomes the primary documented
interface.

## Governing Spec Sections

- all sections in `spec.md`

## Verified Available Assets

- `docs/_specs/nextjs-platform-transition/spec.md`
- all prior sprint docs in this folder
- the live Next.js frontend, backend Python services, tests, and setup docs

## Artifact Targets

- any file that requires a targeted QA repair
- the QA notes recorded from this sprint

## Tasks

1. reread the governing spec and each sprint doc in order
2. inspect the live repository structure, frontend code, backend code, and docs
   against the workstream contract
3. rerun the Python, frontend, and browser verification commands
4. repair any verified gap without widening scope
5. record the QA result and any resolved deviations

## Verify

```bash
ruff format --check .
ruff check .
pytest
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:browser
```

Manual checks:

```bash
npm run dev
```

Also confirm the backend service, Terraform validation, Checkov scan, and a
safe GitOps sandbox flow behave as documented.

## Completion Checklist

- the repository matches the workstream spec and sprint docs
- the new frontend is the documented primary interface
- verification evidence exists for the live Python and frontend stacks
- QA fixes are applied and re-verified
- no unresolved scope drift remains in the transition workstream

## QA Deviations

- `README.md` underreported the live browser verification surface and still
   described `tests/browser/` as reserved for later sprints; Sprint 5 QA updated
   the landing docs to reflect the live workflow smoke coverage and the full
   verification command set.
- `agent.md`, `docs/_specs/README.md`, and
   `docs/_specs/nextjs-platform-transition/spec.md` still described the
   transition workstream as in progress; Sprint 5 QA updated those status
   surfaces to reflect the completed workstream.
- `components/site/site-header.tsx` and `components/site/site-footer.tsx` still
   advertised Sprint 2 and future Checkov/GitOps work; Sprint 5 QA updated the
   live shell copy and added regression coverage so the shared frame matches the
   completed workflow.
- A live GitOps sandbox pull-request creation could not be executed in this
   environment because `GITHUB_TOKEN`, `GITHUB_REPOSITORY`, and
   `GITHUB_BASE_BRANCH` were not configured. Sprint 5 QA verified the documented
   server-side configuration error path instead.