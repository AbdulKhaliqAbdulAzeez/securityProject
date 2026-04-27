# AI-Powered Terraform Architect & Validator

This repository is transitioning from a Python-only Streamlit MVP into a
dual-stack project with a root Next.js frontend and a dedicated Python backend.
The current sprint exposes the verified Terraform generation, validation, and
Checkov-backed security scanning modules through a Python API that the Next.js
frontend can call directly.

## Current Product Surface

- the Python backend still generates AWS-focused Terraform with a Gemini-first
	Google Gen AI SDK integration
- the backend still validates generated HCL locally with `terraform fmt`,
	`terraform init`, and `terraform validate`
- the backend now runs `checkov -d <temporary-workspace>` after Terraform
	validation succeeds and blocks readiness on security findings
- the new root Next.js application now submits prompts through `app/api/workflow`
	and renders live backend responses, including specific Checkov warnings
- the Streamlit workflow remains available as a backend-side fallback surface

The system remains validation-only. It does not run `terraform apply`,
`terraform destroy`, or any equivalent deploy step.

## Repository Map

- `app/` - Next.js App Router frontend scaffold for the transition workstream
- `backend/` - Python generation, validation, and Streamlit workflow modules
- `components/site/` - frontend shell components
- `components/ui/` - reusable frontend primitives
- `components/workflow/` - Terraform workflow-specific frontend components
- `lib/` - shared frontend data and helper modules
- `public/` - static assets used by the Next.js app
- `tests/app/` - frontend unit and component tests run with Vitest
- `tests/browser/` - reserved browser-test surface for later sprints
- `tests/python/` - backend pytest coverage
- `docs/foundation/` - durable operating rules, quality rules, and workflow docs
- `docs/_specs/` - governing spec and sprint artifacts for implementation
- `docs/templates/` - reusable templates for later sprint, QA, and change-note work

## Local Setup

### 1. Install Terraform

Install the Terraform CLI from HashiCorp's official distribution for your
platform and confirm it is available on your shell path:

```bash
terraform version
```

### 2. Create A Python Environment

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Install Checkov

Install the Checkov CLI in the same shell environment you use for the backend:

```bash
pip install checkov
checkov --version
```

If you install Checkov another way, make sure the `checkov` executable is still
available on your shell path before you run the backend.

### 4. Install Node.js Dependencies

Use a current Node.js release that supports Next.js 16, then install the root
frontend workspace dependencies:

```bash
npm install
```

### 5. Configure Your Gemini API Key

Copy `.env.example` to `.env` and set either `GOOGLE_API_KEY` or
`GEMINI_API_KEY`, or export one of those variables in your shell before
starting the backend workflow.

```bash
cp .env.example .env
```

Then edit `.env` and add your key, for example:

```bash
GOOGLE_API_KEY="your-key-here"
GEMINI_MODEL="gemini-3-flash"
```

The backend normalizes `gemini-3-flash` to the current Gemini Developer API
runtime alias automatically, so the configured intent stays stable even when
the live model name is exposed as `gemini-3-flash-preview`.

If no key is configured, the backend falls back to a safe starter Terraform
file so the validation and security loop can still be demonstrated.

## Run The Project Locally

Run the Python workflow API in one terminal:

```bash
python -m uvicorn backend.api:app --reload --host 127.0.0.1 --port 8000
```

Run the Next.js frontend in a second terminal:

```bash
npm run dev
```

If your backend is not running on `http://127.0.0.1:8000`, set
`BACKEND_API_BASE_URL` before starting the frontend.

Run the existing Streamlit workflow from the new backend location:

```bash
streamlit run backend/streamlit_app.py
```

The Streamlit surface remains useful as a backend-side reference flow, but the
primary web workflow now runs through the Next.js UI plus the Python API bridge.

## Verification Commands

The current verification commands are:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
ruff format --check .
ruff check .
pytest
checkov --version
```

## Orchestration Alignment

This repository follows the same durable-artifact model as the reference
orchestration project:

1. a feature spec defines the contract
2. sprint docs define bounded execution units
3. implementation follows one sprint at a time
4. QA is treated as a separate pass

The original Python MVP artifacts live under `docs/_specs/site-foundation/`.
The active dual-stack transition workstream lives under
`docs/_specs/nextjs-platform-transition/`.

