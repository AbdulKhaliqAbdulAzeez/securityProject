# Professional Development Rules

These rules are non-negotiable for work in this repository.

## Scope And Architecture

- Keep changes bounded to the current sprint or change note.
- Prefer the smallest change that solves the real problem.
- Do not widen from the AWS-only MVP or Gemini-first path without a new spec.
- Do not add infrastructure deployment behavior to a validation-only feature.

## Typing And Interfaces

- Use explicit function signatures and stable return shapes.
- Prefer small, composable modules over one monolithic file.
- Raise clear exceptions for invalid input instead of silently accepting bad data.

## Secrets And Safety

- Never commit `.env` files, Streamlit secrets, Terraform state, or credentials.
- Treat generated Terraform as untrusted until the validation loop passes.
- Never add `terraform apply` or `terraform destroy` to the MVP without an
  approved spec and explicit safety design.
- Do not log private token values, secret material, or provider credentials.

## Dependency Discipline

- Add dependencies only when they solve a real problem in the current sprint.
- Prefer well-maintained libraries with a clear purpose.
- Document any new dependency in the relevant sprint or README if it changes setup.

## Verification

- Run the repository verification commands before claiming completion.
- Add or update tests when behavior changes in a way that can be checked.
- Do not treat manual eyeballing as a substitute for deterministic verification.

## Documentation Discipline

- Update docs when setup, workflow, or behavior changes.
- Keep durable guidance in `docs/foundation/` and planning artifacts in
  `docs/_specs/`.
- Do not leave future-state wording in docs after the implementation exists.

## Git Hygiene

- Make one logical change per commit.
- Keep QA fixes separate from initial implementation commits when possible.
- Do not mix unrelated cleanup into a bounded sprint.

## Review Standards

- Review for correctness, safety, scope control, and missing verification.
- Challenge hidden assumptions about Terraform behavior and provider setup.
- Prefer evidence from the live repo over polished language from the assistant.
