# AI-Powered Terraform Architect & Validator

This repository is a documentation-first Python MVP that turns natural-language
infrastructure requests into AWS Terraform, formats the generated HCL, and
validates it locally with the Terraform CLI.

The project adapts the orchestration, spec, and sprint workflow from the
reference materials used during local project setup to a Python, Streamlit,
and Terraform stack.

## What The MVP Does

- accepts a natural-language infrastructure request through a Streamlit UI
- generates AWS-focused Terraform with a Gemini-first LangChain integration
- writes the generated HCL into a temporary Terraform workspace
- runs `terraform fmt`, `terraform init`, and `terraform validate`
- shows formatted Terraform and validation logs side by side

The MVP is intentionally validation-only. It does not run `terraform apply`,
`terraform destroy`, or any equivalent deploy step.

## Repository Map

- `app.py` - Streamlit interface for prompt input, HCL output, and validation logs
- `ai_generator.py` - Gemini-first Terraform generation module with a safe fallback
- `tf_validator.py` - temporary-workspace Terraform validation engine
- `tests/` - baseline unit tests for the generation and validation modules
- `docs/foundation/` - durable operating rules, quality rules, and workflow docs
- `docs/_specs/` - governing spec and sprint artifacts for implementation
- `docs/templates/` - reusable templates for later sprint, QA, and change-note work

## Local Setup

### 1. Install Terraform

Install the Terraform CLI from HashiCorp's official distribution for your
platform and confirm it is available on your shell path:

```bash
terraform version
```

### 2. Create A Python Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Your Gemini API Key

Copy `.env.example` to `.env` and set either `GOOGLE_API_KEY` or
`GEMINI_API_KEY`, or export one of those variables in your shell before
starting the app.

```bash
cp .env.example .env
```

Then edit `.env` and add your key, for example:

```bash
GOOGLE_API_KEY="your-key-here"
GEMINI_MODEL="gemini-2.5-flash"
```

If no key is configured, the app falls back to a safe starter Terraform file so
the validation loop and UI can still be demonstrated.

### 4. Run The Streamlit App

```bash
streamlit run app.py
```

## Verification Commands

The baseline local quality commands are:

```bash
ruff format --check .
ruff check .
pytest
```

## Orchestration Alignment

This repository follows the same durable-artifact model as the reference
orchestration project:

1. a feature spec defines the contract
2. sprint docs define bounded execution units
3. implementation follows one sprint at a time
4. QA is treated as a separate pass

The adapted method for this Python repository is documented under
`docs/foundation/`, and the completed `site-foundation` workstream artifacts
live under `docs/_specs/site-foundation/`.

