# Sprint 1: Secure Prompt Catalog

## Goal

Replace broad empty-state suggestions with centralized secure-by-default prompt
templates.

## Governing Spec Sections

- Secure Suggested Prompt Catalog
- UX Requirements
- Test Requirements

## Verified Available Assets

- `components/chat/chat-shell.tsx` currently defines inline suggestions.
- `components/chat/chat-input.tsx` fills the textarea when a suggestion is clicked.
- `tests/app/chat-interface.test.tsx` already tests suggestion behavior.
- `tests/browser/chat-smoke.spec.ts` and `tests/browser/homepage-smoke.spec.ts`
  provide browser coverage for the chat UI.

## Artifact Targets

- `lib/suggested-prompts.ts` or equivalent new catalog module
- `components/chat/chat-shell.tsx`
- `tests/app/chat-interface.test.tsx`
- `tests/browser/homepage-smoke.spec.ts`

## Tasks

1. Create a typed exported prompt catalog with three secure prompts:
   - private versioned encrypted S3 with public access blocked
   - VPC with public/private subnets, flow logs, restricted security groups
   - EC2 with encrypted storage, IMDSv2, no public SSH
2. Replace inline `ChatShell` suggestions with the catalog.
3. Keep suggestion click behavior as composer-fill-only.
4. Update app tests to assert the new prompt text.
5. Add a Playwright assertion that secure suggestions render on an empty thread.

## Verify

```bash
npm test -- tests/app/chat-interface.test.tsx
npm run test:browser
```

## Completion Checklist

- [ ] No generic `Create an S3 bucket` suggestion remains.
- [ ] Suggestions are imported from one source of truth.
- [ ] Clicking a suggestion inserts the exact secure prompt.
- [ ] Existing manual chat input still works.

## QA Deviations

- Record any prompt text shortened for chip layout or mobile fit.

