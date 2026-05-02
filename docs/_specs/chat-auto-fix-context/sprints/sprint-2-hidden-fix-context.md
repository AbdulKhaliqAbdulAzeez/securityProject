# Sprint 2: Hidden Fix Context

## Goal

Make the client-side fix request carry structured validation, security, and
readiness metadata without exposing raw logs as visible chat text.

## Governing Spec Sections

- Interface Changes: Agent Context
- Interface Changes: Fix Request
- Acceptance Criteria

## Verified Available Assets

- `lib/chat-agent.ts` stores workflow context and calls `submitFixRequest`.
- `lib/workflow-api.ts` owns the browser API request body.
- `tests/app/chat-agent.test.ts` already validates fix context forwarding.

## Artifact Targets

- `lib/chat-agent.ts`
- `lib/workflow-api.ts`
- `tests/app/chat-agent.test.ts`

## Tasks

1. Extend `AgentContext` with readiness, validation, and security metadata.
2. Populate metadata from every workflow response.
3. Pass metadata into `submitFixRequest`.
4. Make the assistant fix preamble context-aware.
5. Update tests to assert the hidden metadata and visible preamble.

## Verify

```bash
npm test -- tests/app/chat-agent.test.ts
```

## Completion Checklist

- [ ] Fix requests include structured metadata.
- [ ] Security findings remain hidden context, not visible chat prose.
- [ ] Fix preamble names the blocked gate when possible.

