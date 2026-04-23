# Maintainer Reading Guide

This repository is both a working Python MVP and a teaching example for
disciplined AI-assisted software delivery.

Any future agent or maintainer should enter the repository through the same
read path so work stays bounded and the durable artifacts remain the source of
truth.

## Recommended Read Order

1. `agent.md`
2. `README.md`
3. `docs/foundation/orchestration-method.md`
4. `docs/foundation/professional-development-rules.md`
5. `docs/foundation/commit-and-review-guide.md`
6. `docs/foundation/technology-orientation.md`
7. `docs/foundation/verification-and-deployment.md`
8. `docs/_specs/README.md`
9. `docs/_specs/site-foundation/spec.md`
10. the active sprint doc in `docs/_specs/site-foundation/sprints/`
11. the live code and tests touched by that sprint

## Documentation Roles

- `README.md` is the landing document for humans and recruiters.
- `agent.md` is the single entry document for coding agents.
- `docs/foundation/` contains durable workflow, quality, and engineering rules.
- `docs/_specs/` contains planning artifacts and bounded sprint contracts.
- `docs/templates/` contains reusable templates for new artifacts.

Do not collapse these layers into one another.

## Starting Work In This Repository

Before changing anything:

1. decide whether the task uses the full workflow or a lightweight change note
2. identify the governing spec and sprint, if one exists
3. verify the live repository state before writing docs about it
4. confirm the exact files that are allowed to change
5. run the relevant verification commands before claiming completion

## Project Boundaries For The MVP

- AWS-only Terraform generation
- Gemini-first LLM path
- local validation only through `fmt`, `init`, and `validate`
- no deploy path, remote state, or multi-cloud abstraction in the first MVP
