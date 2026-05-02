# Chat Auto-Fix Context Specification

## Summary

Improve the chat auto-fix workflow so the button-triggered fix action is
descriptive in the visible conversation while validation and Checkov failure
details are sent to the AI as hidden repair context.

## Goals

- Replace the visible `fix` chat bubble with specific user-facing copy.
- Preserve the existing `/api/fix` endpoint and current chat-first workflow.
- Send the original prompt, current Terraform, validation logs, Checkov
  findings, and readiness metadata to the fix model prompt.
- Keep raw validation and security details inside their existing result cards,
  not as a new chat message.
- Verify the button path with app tests and Playwright.

## Non-Goals

- Do not add a new backend endpoint.
- Do not introduce a second AI call for intent detection.
- Do not remove the expandable validation or security logs.
- Do not change GitOps deployment behavior.

## User Experience

When a workflow is blocked, the readiness card continues to show the
`Auto-Fix Issues` button. Activating it creates a user bubble with contextual
copy:

- Security blocked: `Fixing Checkov security findings.`
- Validation blocked: `Fixing Terraform validation errors.`
- Scanner/setup blocked: `Fixing the workflow blocker before security scanning can complete.`
- Unknown blocked state: `Fixing blocked workflow checks.`

The assistant then posts a contextual status message before the regenerated
workflow cards:

- Security blocked: `I'm repairing the Checkov security findings and will re-run the workflow checks.`
- Validation blocked: `I'm repairing the Terraform validation errors and will re-run validation and security scanning.`
- Unknown blocked state: `I'm repairing the blocked workflow checks and will re-run validation and security scanning.`

## Interface Changes

### Chat Actions

Add typed chat actions:

```ts
export type ChatAction =
  | { type: "fix"; visibleText: string }
  | { type: "deploy"; visibleText?: string };
```

Card action handlers accept `ChatAction` instead of raw command strings.

### Agent Context

Extend the chat agent context with structured workflow gate state:

```ts
type AgentContext = {
  terraformCode: string;
  validationErrors: string;
  securityFindings: string;
  isReady: boolean;
  prompt: string;
  readinessStatus: string;
  validationStatus: "passed" | "failed" | "";
  securityStatus:
    | "passed"
    | "failed"
    | "not_run"
    | "scanner_unavailable"
    | "scan_error"
    | "";
  securityFindingCount: number;
};
```

### Fix Request

The fix request keeps existing required fields and adds optional metadata:

```json
{
  "prompt": "Create an S3 bucket",
  "terraform_code": "...",
  "validation_errors": "...",
  "security_findings": "...",
  "readiness_status": "blocked_by_security",
  "validation_status": "passed",
  "security_status": "failed",
  "security_finding_count": 1
}
```

The backend must accept old clients that omit the metadata fields.

## Backend Prompt Requirements

The Gemini fix prompt must include:

- original user request
- current Terraform code
- validation status
- validation errors or logs
- security scan status
- Checkov findings
- readiness status
- instructions to preserve the original infrastructure intent
- instructions to fix only the blockers
- instructions to return complete Terraform HCL with no Markdown fences

## Acceptance Criteria

- Clicking `Auto-Fix Issues` does not show a visible `fix` bubble.
- The visible user bubble describes the repair target.
- `/api/fix` receives validation and security context.
- Raw errors are not duplicated into visible chat text.
- Existing deploy and reset flows keep working.
- App tests and Playwright tests cover the new behavior.
