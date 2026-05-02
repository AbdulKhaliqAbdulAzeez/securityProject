# Sprint 3: Backend Fix Prompt

## Goal

Upgrade the backend fix prompt so Gemini receives a clear repair brief while
remaining compatible with older `/api/fix` clients.

## Governing Spec Sections

- Fix Request
- Backend Prompt Requirements
- Acceptance Criteria

## Verified Available Assets

- `app/api/fix/route.ts` forwards the Next.js request to FastAPI.
- `backend/api.py` defines `FixRequest`.
- `backend/ai_generator.py` builds the Gemini fix prompt.
- `tests/python/test_api.py` and `tests/python/test_ai_generator.py` cover backend behavior.

## Artifact Targets

- `app/api/fix/route.ts`
- `backend/api.py`
- `backend/ai_generator.py`
- `tests/python/test_api.py`
- `tests/python/test_ai_generator.py`

## Tasks

1. Parse optional metadata in the Next.js fix route.
2. Add optional metadata fields to the FastAPI `FixRequest`.
3. Thread metadata into `generate_fixed_terraform_result`.
4. Rewrite the fix prompt to include status metadata and explicit repair rules.
5. Add Python tests for old and new payload compatibility.

## Verify

```bash
pytest tests/python/test_api.py tests/python/test_ai_generator.py
```

## Completion Checklist

- [ ] Old fix payloads still work.
- [ ] New fix payloads include metadata in the model prompt.
- [ ] Prompt tells the model to preserve original infrastructure intent.

