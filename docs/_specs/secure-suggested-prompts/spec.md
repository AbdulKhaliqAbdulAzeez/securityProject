# Secure Suggested Prompts and Scan Reliability Specification

## Summary

Improve the empty-state suggested questions so first-run generated Terraform is
more likely to pass validation and Checkov without requiring the user to click
`Auto-Fix Issues` for every script. Pair that UX improvement with stronger
security-scan reliability checks so users can trust the readiness gate.

## Current Findings

- `components/chat/chat-shell.tsx` currently offers broad prompts:
  - `Create an S3 bucket`
  - `Set up a VPC with subnets`
  - `Provision an EC2 instance`
- `backend/ai_generator.py` currently asks the model to prefer a minimal
  Terraform document. Minimal AWS infrastructure is often not Checkov-clean.
- The local validation path is wired as a hard gate:
  - `terraform fmt main.tf`
  - `terraform init -backend=false -input=false -no-color`
  - `terraform validate -no-color`
  - `checkov -d . --framework terraform --output json`
- Current local tool availability during review:
  - Terraform: `1.14.9`
  - Checkov: `3.2.525`
- Existing tests cover successful validation, Checkov findings, missing
  Terraform, missing Checkov, scanner lookup inside `.venv`, and scan errors.

## Goals

- Replace generic suggestion chips with secure, specific infrastructure prompts.
- Make suggestions describe the security properties the model should include.
- Strengthen the generation prompt so every request is treated as
  secure-by-default AWS Terraform unless the user explicitly asks otherwise.
- Add a small curated prompt catalog that can be tested independently.
- Add scan reliability signals so the UI distinguishes:
  - checks passed
  - checks failed with findings
  - scanner unavailable
  - scanner error or malformed scanner output
- Add fixture-based tests that run the Checkov parser against known outputs.
- Add Playwright coverage proving suggested prompts populate the composer and
  can drive a ready workflow without auto-fix.

## Non-Goals

- Do not guarantee that all model responses will pass Checkov on the first try.
- Do not bypass the validation/security gate.
- Do not hide security findings to make generated code look ready.
- Do not run Terraform apply, plan against live cloud accounts, or mutate AWS.
- Do not require a network connection for deterministic tests.

## Secure Suggested Prompt Catalog

Replace the three current suggestions with prompts that include explicit
security controls:

1. `Create a private versioned S3 bucket with encryption and public access blocked`
2. `Create a VPC with public and private subnets, flow logs, and restricted security groups`
3. `Provision an EC2 instance with encrypted storage, IMDSv2 required, and no public SSH`

Catalog requirements:

- Store suggestions in a single exported constant, not inline inside
  `ChatShell`.
- Keep labels short enough for suggestion chips.
- Use the exact prompt text as the value inserted into the composer.
- Cover the highest-risk demo resources: S3, VPC/networking, and EC2.

## Generation Prompt Requirements

Update the generation prompt to tell the model:

- Generate AWS Terraform that is secure by default.
- Include provider and Terraform version constraints.
- Prefer private resources unless public exposure is explicitly requested.
- For S3, block public access, enable encryption, and enable versioning when
  appropriate.
- For EC2, require IMDSv2, encrypt EBS volumes, and avoid public SSH ingress.
- For security groups, avoid `0.0.0.0/0` ingress except explicitly requested
  HTTP/HTTPS examples.
- Return one complete `main.tf` document and no Markdown fences.

## Security Scan Reliability Requirements

The security scan remains authoritative only when Checkov executes and returns
valid parseable JSON. The backend must fail closed when it cannot trust the
scanner result.

Required behavior:

- `passed`: Checkov exits `0` and parsed failed checks are empty.
- `failed`: parsed failed checks are present, regardless of exit code.
- `scanner_unavailable`: Checkov binary cannot be found.
- `scan_error`: Checkov exits non-zero with no parsed findings, returns invalid
  JSON, times out, or returns an unexpected output shape.
- `not_run`: Terraform validation failed before Checkov could run.

Recommended additions:

- Track `scanner_version` in `SecurityScanResult` when available.
- Include a short scanner health line in the security card for
  `scanner_unavailable` and `scan_error`.
- Add a backend health helper that reports Terraform and Checkov availability
  without generating infrastructure.

## UX Requirements

- The empty-state suggestions should set the composer text, not auto-submit.
- Suggestions should make the first user action more likely to produce secure
  Terraform.
- If a first-generation result is ready, the readiness card should show
  `Deploy to GitHub`, not `Auto-Fix Issues`.
- If a scan is unavailable or errors, the readiness card must clearly identify
  a scanner/setup blocker rather than implying the Terraform is insecure.

## Test Requirements

Frontend:

- Suggestion chips render the secure prompt catalog.
- Clicking a suggestion fills the composer with the exact secure prompt.
- Browser test mocks a ready response for a secure suggestion and verifies no
  auto-fix button appears.

Backend:

- Prompt builder tests verify secure-by-default instructions are present.
- Checkov parser tests cover:
  - valid failed checks
  - empty failed checks
  - invalid JSON
  - missing `results`
  - non-list `failed_checks`
- Validator tests verify malformed scanner output produces `scan_error`.

End-to-end smoke:

- Run app tests.
- Run Python validator/API/generator tests.
- Run Playwright browser tests.

## Acceptance Criteria

- Suggested prompts are specific, security-focused, and centralized.
- Generation instructions bias outputs toward Checkov-clean Terraform.
- Existing auto-fix still works for blocked responses.
- Security scan states are fail-closed and accurately represented.
- Tests and Playwright pass after implementation.

