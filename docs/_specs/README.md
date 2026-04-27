# Specifications Index

This directory contains the governing specifications and sprint documents for
the AI-Powered Terraform Architect & Validator repository.

Every foundational feature should follow the same lifecycle:

1. spec
2. spec QA
3. sprint doc
4. sprint QA
5. implementation
6. implementation QA

## Active Workstreams

| Workstream | Status | Sprints | What It Produces |
| ---------- | ------ | ------- | ---------------- |
| [site-foundation](site-foundation/) | Complete | 6 | Repository bootstrap, generator contract, Terraform validation engine, Streamlit UI, safety hardening, QA pass |
| [nextjs-platform-transition](nextjs-platform-transition/) | Complete | 6 | Next.js application shell, Python backend bridge, Checkov security gate, GitHub pull-request delivery, QA pass |
| [ui-redesign](ui-redesign/) | Active | 4 | Design system update, premium dark theme, split-pane command center layout, AI workflow cues, QA pass |

## How To Read A Workstream

1. Read `spec.md` first.
2. Read the sprint docs in order.
3. Inspect the live code and tests those sprints affect.
4. Treat the final QA sprint as a separate pass, not as an appendix.

## Current Program Order

1. use the completed `nextjs-platform-transition` workstream as the baseline before widening into hosted deployment or broader provider expansion
2. execute the `ui-redesign` workstream to upgrade the Next.js baseline to a premium dark-mode developer tool UI for demo readiness
3. define later workstreams for provider expansion, hosted deployment, or deeper evaluation only under a new approved spec
