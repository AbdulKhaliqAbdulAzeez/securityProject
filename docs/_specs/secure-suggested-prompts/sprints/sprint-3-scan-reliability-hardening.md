# Sprint 3: Security Scan Reliability Hardening

## Goal

Make Checkov result handling fail-closed and more observable when scanner output
is unavailable, malformed, or inconclusive.

## Governing Spec Sections

- Security Scan Reliability Requirements
- UX Requirements
- Test Requirements

## Verified Available Assets

- `backend/tf_validator.py` owns Checkov execution and JSON parsing.
- `tests/python/test_tf_validator.py` covers pass, fail, missing CLI, and venv
  binary discovery.
- Local review confirmed Terraform `1.14.9` and Checkov `3.2.525` are available.

## Artifact Targets

- `backend/tf_validator.py`
- `backend/api.py` if response metadata changes
- `lib/workflow-api.ts` if frontend types change
- `components/chat/cards/security-card.tsx` if scanner health is surfaced
- `tests/python/test_tf_validator.py`
- `tests/app/chat-cards.test.tsx`

## Tasks

1. Add explicit parser result metadata so invalid JSON is distinguishable from
   valid empty findings.
2. Return `scan_error` when Checkov output is malformed or has an unexpected
   shape.
3. Preserve `failed` when any failed checks are parsed, regardless of Checkov
   exit code.
4. Optionally capture Checkov version in the security scan result.
5. Surface scanner setup/error states clearly in the security card.
6. Add parser and validator tests for malformed JSON and unexpected output.

## Verify

```bash
.venv/bin/pytest tests/python/test_tf_validator.py tests/python/test_api.py
npm test -- tests/app/chat-cards.test.tsx
```

## Completion Checklist

- [ ] Invalid Checkov JSON cannot be treated as a pass.
- [ ] Unexpected Checkov output cannot be treated as a pass.
- [ ] Parsed findings still block readiness.
- [ ] Missing Checkov remains a setup blocker.
- [ ] UI clearly distinguishes scanner errors from security findings.

## QA Deviations

- Record any real Checkov output shape that requires parser adjustment.

