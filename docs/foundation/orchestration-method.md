# Orchestration Method

## Why This Repository Uses Durable Artifacts

AI assistance is fast, but speed creates the same recurring problems that the
reference repository was built to control:

- drift away from the actual request
- loss of context between sessions
- ambiguous completion claims
- weak accountability for decisions

This repository uses durable artifacts instead of chat memory to control those
problems.

## Artifact Memory

The source of truth for important reasoning belongs in files, not in chat.

Examples in this repository:

- `docs/_specs/site-foundation/spec.md` records the product contract
- sprint docs record bounded implementation units
- foundation docs record the operating rules that stay true across sessions

## The Core Primitives

### Role

The agent needs a clear role for each task: implementer, reviewer, QA pass,
auditor, or planner.

### Scope

The task must define what is allowed to change and what is out of bounds.

### Invariants

The task must define what cannot be broken while work is underway.

### Acceptance Criteria

Completion must be explicit and checkable.

### Sequencing

Large work is broken into ordered sprints so the implementation stays auditable.

### Verification

Claims are accepted when the relevant checks pass, not when the prose sounds
confident.

## The Full Workflow

For foundational work, use this lifecycle:

1. write the governing spec
2. QA the spec
3. write the sprint doc
4. QA the sprint doc
5. implement the sprint
6. QA the implementation

This workflow is intentionally strict. The repository is meant to preserve
judgment and auditability, not just produce code quickly.

## What A Spec Must Do

A spec defines the feature-level contract. It should state:

- the problem being solved
- the design goals
- the architecture
- the safety and security boundaries
- the testing strategy
- the sprint plan

## What A Sprint Doc Must Do

A sprint doc turns a large contract into one bounded execution unit. It should
state:

- one clear goal
- the exact artifacts in scope
- verified inputs and assumptions
- concrete implementation tasks
- verification commands
- a completion checklist

## QA Is A Separate Real Pass

QA is not a summary sentence at the end of implementation.

The QA pass must:

- reread the governing spec
- reread the sprint doc
- inspect every changed file
- compare the result against the actual requirements
- rerun verification after any fix

## Why This Matters For Terraform Work

Terraform makes mistakes expensive if the workflow becomes casual.

This MVP avoids that by treating generated HCL as untrusted until the local
validation loop passes, and by explicitly keeping deploy actions out of scope.
