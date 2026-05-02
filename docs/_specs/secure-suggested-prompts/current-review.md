# Current Review: Suggested Prompts and Security Scan Reliability

## Review Date

May 2, 2026

## Tool Availability

- Terraform is installed: `1.14.9`
- Checkov is installed: `3.2.525`

## Commands Run

```bash
command -v terraform && terraform version
command -v checkov || true; .venv/bin/checkov --version 2>/dev/null || true
npm run typecheck
npm test
.venv/bin/pytest
npm run test:browser
```

## Results

- `npm run typecheck`: passed
- `npm test`: passed, 17 tests
- `.venv/bin/pytest`: passed, 44 tests
- `npm run test:browser`: passed, 5 tests

The first Playwright run failed before executing tests because an old Next dev
server was holding `.next/dev/lock`. After stopping the stale local dev server,
the browser suite passed.

## Current Suggested Prompt Risk

The current suggestions are intentionally simple but too broad:

- `Create an S3 bucket`
- `Set up a VPC with subnets`
- `Provision an EC2 instance`

These prompts do not tell the model to include common Checkov-required security
controls, so a first generated script can reasonably fail and require
`Auto-Fix Issues`.

## Current Security Scan Confidence

Reliable behaviors already covered by tests:

- Terraform CLI missing produces validation failure and prevents Checkov.
- Terraform validation failure prevents Checkov and returns `not_run`.
- Checkov missing returns `scanner_unavailable`.
- Parsed Checkov failed checks return `failed` and block readiness.
- Checkov in the active Python environment can be discovered.
- Timeouts return readable command logs.

Reliability gap found during review:

- `_extract_checkov_findings` returns an empty list for invalid JSON or
  unexpected output shapes.
- `_run_checkov_scan` currently treats `return_code == 0` with an empty findings
  list as `passed`.
- Therefore, malformed Checkov JSON with exit code `0` could be incorrectly
  treated as a passing scan.

This gap is captured in
`sprints/sprint-3-scan-reliability-hardening.md` as a fail-closed parser
requirement.

## Recommendation

Implement Sprint 1 and Sprint 2 first to reduce avoidable auto-fix loops, then
implement Sprint 3 before relying on Checkov pass states for a demo or release.
