# Sprint 3: Streamlit Interface

## Goal

Connect the generation and validation modules into a single Streamlit workflow
that exposes prompt input, generated Terraform, and validation logs.

## Governing Spec Sections

- UX Requirements
- Architecture
- Verification Strategy

## Verified Available Assets

- `app.py`
- `ai_generator.py`
- `tf_validator.py`
- setup instructions in `README.md`

## Artifact Targets

- `app.py`
- `README.md`

## Tasks

1. create the prompt input and primary submission action
2. call the generation module and validation module in sequence
3. display formatted Terraform and validation logs side by side
4. preserve the latest result in session state
5. show helpful feedback for missing API keys or Terraform setup

## Verify

```bash
python -m compileall app.py
```

Manual smoke test:

```bash
streamlit run app.py
```

## Completion Checklist

- the UI accepts a prompt
- generation and validation run from one action
- code and logs are both visible after execution
- error states are visible instead of silent

## QA Deviations

- none recorded yet
