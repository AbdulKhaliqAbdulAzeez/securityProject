# Sprint 0: Project Bootstrap

## Goal

Create the initial repository scaffold, local development contract, and durable
documentation surfaces required for future implementation sprints.

## Governing Spec Sections

- Problem Statement
- MVP Scope
- Architecture
- Verification Strategy

## Verified Available Assets

- `docs/_project_idea/agent_letter.md`
- reference orchestration materials under `docs/_nextjs_ai_orchestration_reference/`
- root repository with `docs/` and Git history already initialized

## Artifact Targets

- `README.md`
- `agent.md`
- `.gitignore`
- `requirements.txt`
- `pyproject.toml`
- `docs/foundation/`
- baseline code and tests under the root and `tests/`

## Tasks

1. establish the root repository documents and ignore rules
2. create the Python dependency and quality-tool manifest
3. create the initial module skeleton for generation, validation, and UI flow
4. create the durable foundation docs for agents and maintainers
5. add baseline tests for the first failure modes

## Verify

```bash
python -m compileall app.py ai_generator.py tf_validator.py tests
```

If the environment is fully provisioned, also run:

```bash
ruff format --check .
ruff check .
pytest
```

## Completion Checklist

- root docs exist and match the live repository
- ignore rules cover Python caches, secrets, and Terraform working state
- Python skeleton files exist with importable module boundaries
- baseline tests exist for generator and validator failure handling
- foundation docs exist for workflow, verification, commit discipline, and rules

## QA Deviations

- none recorded yet
