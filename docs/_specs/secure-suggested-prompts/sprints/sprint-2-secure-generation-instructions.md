# Sprint 2: Secure Generation Instructions

## Goal

Bias first-generation Terraform toward validation- and Checkov-clean output so
auto-fix becomes an exception instead of the common path.

## Governing Spec Sections

- Generation Prompt Requirements
- Acceptance Criteria

## Verified Available Assets

- `backend/ai_generator.py` owns `_build_prompt`.
- `tests/python/test_ai_generator.py` already inspects model prompt contents.
- The current prompt asks for minimal Terraform, which can conflict with
  secure-by-default infrastructure.

## Artifact Targets

- `backend/ai_generator.py`
- `tests/python/test_ai_generator.py`

## Tasks

1. Update `_build_prompt` with secure-by-default AWS Terraform instructions.
2. Add service-specific guardrails for S3, EC2, and security groups.
3. Keep the single-file `main.tf` and no-Markdown-fence requirements.
4. Update tests to assert the secure generation instructions are present.
5. Confirm fallback behavior is unchanged when no API key is configured.

## Verify

```bash
.venv/bin/pytest tests/python/test_ai_generator.py
```

## Completion Checklist

- [ ] Prompt includes secure-by-default wording.
- [ ] Prompt explicitly mentions S3 public access block, encryption, and versioning.
- [ ] Prompt explicitly mentions EC2 IMDSv2 and encrypted EBS.
- [ ] Prompt discourages public ingress except where explicitly requested.
- [ ] Existing model response cleaning tests still pass.

## QA Deviations

- Record any prompt instruction that conflicts with actual Checkov behavior.

