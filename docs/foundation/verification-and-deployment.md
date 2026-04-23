# Verification And Deployment

## Verification Philosophy

AI-generated code can look convincing long before it is correct. This repository
uses deterministic verification to replace confident prose with evidence.

## Baseline Quality Commands

The default quality commands for this repository are:

```bash
ruff format --check .
ruff check .
pytest
```

Use them as the baseline for Python changes.

## Manual Validation Expectations

Some behaviors in this repository require manual confirmation as well:

- the Streamlit app should launch locally with `streamlit run app.py`
- Terraform should be installed and discoverable on `PATH`
- the generated HCL and validation logs should appear in the UI as expected

## Terraform-Specific Checks

The application-level validation loop runs:

1. `terraform fmt`
2. `terraform init -backend=false -input=false -no-color`
3. `terraform validate -no-color`

The goal is syntactic and structural validation, not infrastructure deployment.

## Deployment Status

Application deployment is intentionally out of scope for the first MVP.

Any future workstream that adds hosted deployment, shared environments, or
remote state must define those concerns in a separate spec.
