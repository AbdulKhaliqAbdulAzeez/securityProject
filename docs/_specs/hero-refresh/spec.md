# Hero Refresh Specification

## Vision

Add a Wealthwise-style above-the-fold hero to the chat-first Terraform security app. The hero should make the product value clear before the first prompt while keeping the chat as the primary workflow surface.

## Goals

- Show a premium, image-backed hero in the initial chat state.
- Explain the generation, validation, Checkov security, repair, and GitOps delivery loop.
- Give users a direct path into the chat input.
- Preserve the existing chat workflow, backend endpoints, and card rendering.

## UX Contract

- The hero appears only while the thread is in its welcome-only state.
- The hero uses a media layer, dark overlay, centered content, capability pills, and two CTAs.
- Primary CTA, **Start building**, focuses the chat textarea.
- Secondary CTA, **Use secure VPC prompt**, fills the textarea with a vetted starter prompt.
- After the user sends a message, the hero no longer takes up the initial viewport and the conversation remains the main surface.

## Content

- Eyebrow: `AI Terraform Security Agent`
- Title: `Generate secure infrastructure with validation built in.`
- Subtitle: `Describe the cloud architecture you need. The agent generates Terraform, validates it, runs Checkov security scanning, repairs blockers, and prepares GitOps delivery.`
- Pills: `Terraform generation`, `Checkov security gate`, `GitOps PR delivery`

## Implementation Notes

- Use the existing `ChatShell`, `ChatInput`, and chat state model.
- Reuse `public/workflow-grid.svg` as the local visual asset.
- Keep all changes in the frontend surface and documentation.
- Do not change Python backend code, API route contracts, or chat-agent intent detection.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:browser
```
