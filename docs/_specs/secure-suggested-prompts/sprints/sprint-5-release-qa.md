# Sprint 5: Release QA

## Goal

Run the complete confidence suite for the secure suggestions and scanner
reliability work.

## Governing Spec Sections

- Test Requirements
- Acceptance Criteria

## Verified Available Assets

- `package.json` exposes `test`, `typecheck`, and `test:browser`.
- `pyproject.toml` configures Python tests under `tests/python`.
- Local review confirmed Terraform and Checkov binaries are available.

## Artifact Targets

- QA notes under `docs/_specs/secure-suggested-prompts/` if deviations are found
- Test fixtures only if new reliability gaps are discovered

## Tasks

1. Run TypeScript type checking.
2. Run focused app tests for chat and cards.
3. Run Python validator/API/generator tests.
4. Run Playwright.
5. Record tool versions and any residual reliability risks.

## Verify

```bash
npm run typecheck
npm test -- tests/app/chat-interface.test.tsx tests/app/chat-cards.test.tsx tests/app/chat-agent.test.ts
.venv/bin/pytest tests/python/test_tf_validator.py tests/python/test_api.py tests/python/test_ai_generator.py
npm run test:browser
```

## Completion Checklist

- [ ] TypeScript passes.
- [ ] App tests pass.
- [ ] Python tests pass.
- [ ] Playwright passes.
- [ ] Security scan limitations are documented.

## QA Deviations

- Record any failures, fixes, or skipped checks with exact command output.
