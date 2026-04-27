import { NextResponse } from "next/server";

export const runtime = "nodejs";

const backendApiBaseUrl =
  process.env.BACKEND_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

async function readJsonPayload(source: { json: () => Promise<unknown> }): Promise<unknown> {
  try {
    return await source.json();
  } catch {
    return null;
  }
}

function readErrorMessage(payload: unknown): string {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return "Backend fix request failed.";
}

export async function POST(request: Request) {
  const payload = await readJsonPayload(request);
  const prompt =
    payload && typeof payload === "object" && "prompt" in payload && typeof payload.prompt === "string"
      ? payload.prompt.trim()
      : "";

  const terraformCode =
    payload && typeof payload === "object" && "terraform_code" in payload && typeof payload.terraform_code === "string"
      ? payload.terraform_code.trim()
      : "";

  const validationErrors =
    payload && typeof payload === "object" && "validation_errors" in payload && typeof payload.validation_errors === "string"
      ? payload.validation_errors.trim()
      : "";

  const securityFindings =
    payload && typeof payload === "object" && "security_findings" in payload && typeof payload.security_findings === "string"
      ? payload.security_findings.trim()
      : "";

  if (!prompt) {
    return NextResponse.json(
      { message: "A natural-language infrastructure request is required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(`${backendApiBaseUrl}/fix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        prompt,
        terraform_code: terraformCode,
        validation_errors: validationErrors,
        security_findings: securityFindings
      }),
      cache: "no-store",
    });
    const backendPayload = await readJsonPayload(backendResponse);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: readErrorMessage(backendPayload) },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendPayload);
  } catch {
    return NextResponse.json(
      {
        message:
          "Python backend is unavailable. Start it with `python -m uvicorn backend.api:app --reload --host 127.0.0.1 --port 8000` and retry.",
      },
      { status: 503 },
    );
  }
}
