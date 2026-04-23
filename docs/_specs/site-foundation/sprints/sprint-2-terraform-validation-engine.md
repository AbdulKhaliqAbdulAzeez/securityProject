# Sprint 2: Terraform Validation Engine

## Goal

Implement a Terraform validation module that writes generated HCL into a
temporary workspace, runs the local CLI, and returns structured logs.

## Governing Spec Sections

- MVP Scope
- Architecture
- Safety And Security Requirements
- Verification Strategy

## Verified Available Assets

- `tf_validator.py`
- `tests/test_tf_validator.py`
- local Terraform requirement documented in `README.md`

## Artifact Targets

- `tf_validator.py`
- `tests/test_tf_validator.py`
- `README.md` if validation prerequisites change

## Tasks

1. define a stable validation result shape with success state and logs
2. run `terraform fmt`, `terraform init`, and `terraform validate` in order
3. capture stdout, stderr, and exit codes for each command
4. handle the missing-CLI case explicitly
5. preserve the formatted `main.tf` content for UI display

## Verify

```bash
python -m compileall tf_validator.py tests/test_tf_validator.py
pytest tests/test_tf_validator.py
```

Optional manual smoke test if Terraform is installed:

```bash
python -c "from tf_validator import validate_terraform; print(validate_terraform('terraform {}').combined_log())"
```

## Completion Checklist

- the validator uses a temporary local workspace
- logs include command, exit code, stdout, and stderr
- missing Terraform is reported clearly
- formatted code is available in the result object

## QA Deviations

- none recorded yet
