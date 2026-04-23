# Sprint 1: AI Generation Contract

## Goal

Implement a deterministic Terraform generation module that accepts a
natural-language request and returns cleaned AWS Terraform HCL suitable for a
single `main.tf` file.

## Governing Spec Sections

- Product Thesis
- MVP Scope
- Architecture
- Safety And Security Requirements

## Verified Available Assets

- `ai_generator.py`
- `tests/test_ai_generator.py`
- environment-variable based API-key policy in the foundation docs

## Artifact Targets

- `ai_generator.py`
- `tests/test_ai_generator.py`
- `README.md` if setup behavior changes

## Tasks

1. define a stable `generate_terraform` interface
2. constrain the prompt contract to AWS-only Terraform output
3. strip markdown fences and other formatting noise from model output
4. provide a deterministic fallback when a live Gemini call cannot run
5. expand unit tests around output cleaning and fallback behavior

## Verify

```bash
python -m compileall ai_generator.py tests/test_ai_generator.py
pytest tests/test_ai_generator.py
```

Optional manual check if a Gemini key is configured:

```bash
python -c "from ai_generator import generate_terraform; print(generate_terraform('Create an AWS S3 bucket'))"
```

## Completion Checklist

- the generation module rejects empty requests clearly
- the output is cleaned before leaving the module
- fallback behavior is deterministic
- tests cover the main non-network path

## QA Deviations

- none recorded yet
