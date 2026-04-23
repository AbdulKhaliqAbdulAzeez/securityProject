# Lightweight Change Path

## Why This Exists

Not every repository change deserves a full spec and sprint package. Some
changes are narrow, low-risk, and directly verifiable.

For those cases, this repository uses a smaller artifact called a `Change Note`.

## Use The Lightweight Path When The Change Is

- narrow
- low-risk
- low-ambiguity
- easy to verify directly
- unlikely to change architecture or safety boundaries

Examples:

- correcting a README command that is already defined in the live repo
- fixing a broken doc link
- clarifying one paragraph in a durable foundation doc

## Do Not Use The Lightweight Path When The Change Is

- architectural
- multi-session
- safety-sensitive
- likely to alter the workflow or long-term design of the project

When in doubt, choose the full workflow.

## Required Change Note Fields

1. Problem
2. Scope
3. Invariants
4. Files expected to change
5. Verification
6. Outcome

## Example

```text
Change Note

Problem:
The README setup command no longer matches the live dependency file.

Scope:
Update the incorrect setup line in README.md only.

Invariants:
- Do not change the workflow description.
- Do not rewrite unrelated setup sections.

Files expected to change:
- README.md

Verification:
- Check the live command against the repository files.

Outcome:
- README.md updated so the setup command matches the live repository.
```
