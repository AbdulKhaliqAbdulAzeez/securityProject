# Technology Orientation

## Why This Document Exists

This repository is intended to demonstrate both cloud engineering judgment and
disciplined AI-assisted delivery. The technologies below are part of that
teaching surface.

## Active Stack

### Python 3.x

Python is the primary implementation language for the MVP. It is used for the
Streamlit interface, the LangChain integration, and the Terraform validation
workflow.

### Streamlit

Streamlit is the UI layer. It gives the project a fast, low-friction way to
present a prompt box, generated Terraform output, and validation logs without
building a separate frontend stack.

### LangChain

LangChain is the orchestration layer around the LLM call. In this MVP it keeps
the generation step explicit and replaceable while still allowing future
provider expansion.

### Gemini

Gemini is the first provider path for the MVP. The initial implementation is
Gemini-first so the prompt contract stays narrow, testable, and easy to reason
about.

### Terraform CLI

Terraform is the validation engine for the generated HCL. The MVP uses the
local CLI to run `terraform fmt`, `terraform init`, and `terraform validate` in
temporary workspaces.

### subprocess

Python's `subprocess` module is the boundary between the application and the
Terraform CLI. It provides deterministic command execution, captured logs, and
explicit exit codes.

### Ruff

Ruff is the baseline code-quality tool. It provides linting and formatting with
less setup overhead than maintaining separate formatter and linter stacks.

### pytest

pytest is the baseline test runner. The MVP uses it for fast unit-level checks
around output cleaning, error handling, and Terraform validation failure modes.

## Explicitly Deferred For Later Workstreams

- multi-cloud prompt contracts for Azure or GCP
- provider-agnostic runtime abstractions
- deployment environments for the Streamlit app
- infrastructure apply and destroy flows
- remote state backends and authenticated user sessions
