# Site Foundation Specification

## Status

Complete

## Problem Statement

Cloud engineering interviews increasingly expect evidence of Infrastructure as
Code skill and practical AI integration. A generic chat demo is not enough.

The project needs a bounded MVP that demonstrates the ability to:

- translate natural-language infrastructure intent into Terraform
- validate the generated configuration with the real Terraform CLI
- present the result through a usable interface
- do all of the above with durable engineering artifacts instead of ad hoc chat

## Product Thesis

The MVP should show that AI becomes more valuable when it is constrained by a
clear prompt contract, a narrow infrastructure scope, and deterministic
validation.

## Primary Design Goals

1. create a demonstrable portfolio artifact for cloud engineering roles
2. keep the first release narrow enough to verify end to end
3. expose the validation loop rather than hiding it behind AI output
4. preserve the implementation logic in durable specs and sprint docs
5. keep safety boundaries explicit from the first commit

## MVP Scope

### In Scope

- Python 3.x implementation
- Streamlit interface
- Gemini-first generation path through LangChain
- AWS-only Terraform generation
- single-file Terraform output suitable for `main.tf`
- temporary workspace validation through `terraform fmt`, `terraform init`, and
  `terraform validate`
- visible validation logs in the UI
- repository docs, sprint artifacts, and templates for future agent work

### Out Of Scope

- multi-cloud support
- OpenAI as a second provider in the first release
- `terraform apply`, `terraform destroy`, or any deploy step
- remote state backends
- user authentication
- long-lived storage of prompts or generated Terraform files
- production hosting and CI/CD deployment for the app itself

## Architecture

### Application Surface

- `app.py` owns the Streamlit interaction flow
- `ai_generator.py` owns Terraform generation and output cleaning
- `tf_validator.py` owns temporary-workspace validation and log capture

### Documentation Surface

- `README.md` is the landing document
- `agent.md` is the entry point for future coding agents
- `docs/foundation/` stores durable engineering rules
- `docs/_specs/` stores planning artifacts and sprint contracts
- `docs/templates/` stores reusable artifact templates

### Test Surface

- `tests/` stores unit tests for generator and validator behavior

## Safety And Security Requirements

- generated HCL is untrusted until validation succeeds
- secrets must stay in environment variables or Streamlit secrets, never source control
- Terraform state and working directories must not be committed
- the MVP must not introduce apply or destroy behavior
- temporary workspaces must be disposable and local only
- validation logs must be useful without exposing secret values

## UX Requirements

- one prompt box for the infrastructure request
- one primary action to generate and validate
- formatted Terraform displayed in one panel
- validation logs displayed in a separate panel
- transparent feedback for missing API keys or missing Terraform CLI
- predictable failure behavior when generation or validation cannot complete

## Verification Strategy

Baseline repository verification:

```bash
ruff format --check .
ruff check .
pytest
```

Focused validation during bootstrap may also use:

```bash
python -m compileall app.py ai_generator.py tf_validator.py tests
```

Manual checks for UI or Terraform behavior should be called out in the relevant
sprint.

## Sprint Plan

### Sprint 0: Project Bootstrap

Set up the repository structure, Python dependencies, ignore rules, root docs,
foundation docs, and baseline quality tooling.

### Sprint 1: AI Generation Contract

Implement the generation module with a clear prompt contract, markdown-stripping
logic, and a deterministic fallback path.

### Sprint 2: Terraform Validation Engine

Implement temporary-workspace validation with captured logs and safe failure
handling around missing local Terraform setup.

### Sprint 3: Streamlit Interface

Connect the prompt input, generator, validator, and side-by-side output panels
into one UI flow.

### Sprint 4: Security And Reliability Hardening

Tighten secrets handling, input validation, timeout behavior, and no-deploy
guardrails.

### Sprint 5: QA And Release Readiness

Run a separate audit against the spec, sprint docs, and live repository state;
repair any gaps and capture final verification evidence.

## Acceptance Criteria

The site-foundation workstream is complete when:

- the repository contains the documented Python skeleton
- the root docs and foundation docs describe the live repository accurately
- the Streamlit UI can accept a prompt and display generated code plus logs
- the validation module can report missing Terraform or command failures cleanly
- the baseline verification commands are documented and runnable
- the final sprint performs a separate QA pass

## Future Considerations

- add provider abstraction only after the Gemini-first path is stable
- add Azure or GCP support as separate feature specs
- add hosted deployment as a separate workstream with its own safety review
- add richer Terraform evaluation, examples, or policy checks after the MVP loop is stable
