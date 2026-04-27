# Agent Guide

This file is the single entry document for any LLM, agent, or automation
system working in this repository.

It defines the operating rules, read order, scope discipline, and verification
standards for the AI-Powered Terraform Architect & Validator project.

## Purpose Of This Repository

This repository is a dual-stack project that has moved from a Python Streamlit
MVP into a Next.js frontend with a dedicated Python backend for Terraform
generation and validation.

The product goal matters, but the repository also exists to demonstrate a
professional orchestration model for AI-assisted software delivery. Durable
artifacts are part of the system, not an afterthought.

## Read Order For Any New Agent

Before doing meaningful work, read these in order:

1. `agent.md`
2. `README.md`
3. `docs/foundation/maintainer-reading-guide.md`
4. `docs/foundation/orchestration-method.md`
5. `docs/foundation/professional-development-rules.md`
6. `docs/foundation/commit-and-review-guide.md`
7. `docs/_specs/README.md`
8. `docs/_specs/site-foundation/spec.md`
9. the active sprint doc under `docs/_specs/{active-feature}/sprints/`
10. the live code or docs touched by that sprint

## Current Repository State

The repository has completed the `site-foundation` and
`nextjs-platform-transition` workstreams.

Current priorities:

- preserve the durable specs, sprint artifacts, and QA records
- keep the verified Next.js frontend and Python backend behavior intact
- define any later expansion through a new governing spec or an approved
  lightweight change note

## Non-Negotiable Process Rules

### 1. Use The Full Workflow For Foundational Work

For any foundational, ambiguous, high-impact, or multi-session task, the
workflow is mandatory:

1. write the spec
2. QA the spec
3. write the sprint doc
4. QA the sprint doc
5. implement the sprint
6. QA the implementation

Do not skip phases. Do not merge phases. Do not improvise around the process.

### 2. Use The Lightweight Path Only For Narrow Changes

For narrow, low-risk changes, use the `Change Note` workflow described in
`docs/foundation/lightweight-change-path.md`.

If the work changes architecture, safety boundaries, documentation structure,
or the long-term delivery method, use the full workflow instead.

### 3. Specs Define What And Why

Specs live at:

- `docs/_specs/{feature}/spec.md`

Specs must define:

- the problem statement
- the design goals
- the architecture and safety boundaries
- the testing strategy
- the sprint plan
- future considerations

### 4. Sprint Docs Define Exact Execution

Sprint docs live at:

- `docs/_specs/{feature}/sprints/sprint-N-*.md`

Sprint docs must include:

- a clear goal
- referenced spec sections
- verified inputs and assets
- exact artifact targets
- task-by-task execution guidance
- verification steps
- a completion checklist
- a QA deviations section

### 5. QA Is A Separate Pass

QA must read the governing spec, the sprint doc, every changed file, and the
relevant verification output. If QA finds a defect, fix it and rerun the
required verification before declaring completion.

## Terraform Safety Boundaries

- Generated HCL is untrusted until local validation passes.
- The MVP may run `terraform fmt`, `terraform init`, and `terraform validate`.
- Do not add or run `terraform apply`, `terraform destroy`, or any equivalent
  deploy path without a separate approved spec.
- Do not store Terraform state, provider credentials, or generated secrets in
  source control.

## Scope Discipline Rules

- Do not add unrelated features.
- Do not widen from AWS-only MVP scope unless a later spec authorizes it.
- Do not widen from Gemini-first integration unless a later spec authorizes it.
- Do not add dependencies unless the sprint explicitly justifies them.
- Do not rewrite adjacent systems when a local change solves the problem.

## Verification Rules

The baseline repository verification commands are:

```bash
ruff format --check .
ruff check .
pytest
```

Do not claim success without running the relevant checks for the changed slice.

## Secrets Rules

- Do not commit `.env` files, Streamlit secrets, Terraform state, or provider
  credentials.
- Do not print private keys, tokens, or full secret values into logs, docs, or
  chat output.
- Prefer environment variables or Streamlit secrets for local development.

## Commit Rules

Follow `docs/foundation/commit-and-review-guide.md`.

At minimum:

- keep commits scoped to one logical change
- separate implementation commits from QA or cleanup commits
- include verification evidence for non-trivial work

## Expected Agent Behavior

Any agent working here should:

- read before writing
- verify before claiming completion
- preserve durable artifacts
- keep scope tight
- prefer evidence over polished language
- treat the documentation system as part of the product
