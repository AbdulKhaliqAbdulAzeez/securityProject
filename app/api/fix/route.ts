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

function readStringField(payload: unknown, fieldName: string): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const value = (payload as Record<string, unknown>)[fieldName];
  return typeof value === "string" ? value.trim() : "";
}

function readNumberField(payload: unknown, fieldName: string): number {
  if (!payload || typeof payload !== "object") {
    return 0;
  }

  const value = (payload as Record<string, unknown>)[fieldName];
  return typeof value === "number" ? value : 0;
}

export async function POST(request: Request) {
  const payload = await readJsonPayload(request);
  const prompt = readStringField(payload, "prompt");
  const terraformCode = readStringField(payload, "terraform_code");
  const validationErrors = readStringField(payload, "validation_errors");
  const securityFindings = readStringField(payload, "security_findings");
  const readinessStatus = readStringField(payload, "readiness_status");
  const validationStatus = readStringField(payload, "validation_status");
  const securityStatus = readStringField(payload, "security_status");
  const securityFindingCount = readNumberField(payload, "security_finding_count");

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
        security_findings: securityFindings,
        readiness_status: readinessStatus,
        validation_status: validationStatus,
        security_status: securityStatus,
        security_finding_count: securityFindingCount,
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
