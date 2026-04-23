from __future__ import annotations

import os
import re
from dataclasses import dataclass
from textwrap import dedent
from typing import Any

from dotenv import load_dotenv

load_dotenv()

FALLBACK_TERRAFORM = dedent(
    """
    # Fallback Terraform returned because no live Gemini call was executed.
    terraform {
      required_version = ">= 1.6.0"

      required_providers {
        aws = {
          source  = "hashicorp/aws"
          version = "~> 5.0"
        }
      }
    }

    variable "aws_region" {
      description = "AWS region for the generated infrastructure."
      type        = string
      default     = "us-east-1"
    }

    provider "aws" {
      region = var.aws_region
    }

    resource "aws_instance" "web" {
      ami           = "ami-1234567890abcdef0"
      instance_type = "t3.micro"

      tags = {
        Name = "ai-terraform-architect-demo"
      }
    }
    """
).strip()

DEFAULT_GEMINI_MODEL = "gemini-3-flash"
MODEL_NAME_ALIASES = {
    "gemini-3-flash": "gemini-3-flash-preview",
    "models/gemini-3-flash": "models/gemini-3-flash-preview",
}


@dataclass(frozen=True)
class GenerationResult:
    terraform: str
    used_fallback: bool
    message: str


def is_api_key_configured() -> bool:
    return bool(os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))


def _build_prompt(user_request: str) -> str:
    return dedent(
        f"""
        You generate a single Terraform configuration file for AWS.

        Return only valid Terraform HCL.
        Do not return Markdown fences.
        Do not explain the output.
        Keep the file in one Terraform document suitable for `main.tf`.
        Prefer a minimal but coherent configuration that matches the request.

        User request:
        {user_request.strip()}
        """
    ).strip()


def _coerce_response_content(content: Any) -> str:
    if content is None:
        return ""

    if isinstance(content, str):
        return content.strip()

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item.strip())
                continue

            if isinstance(item, dict) and isinstance(item.get("text"), str):
                parts.append(item["text"].strip())
                continue

            text_value = getattr(item, "text", None)
            if isinstance(text_value, str):
                parts.append(text_value.strip())

        return "\n".join(part for part in parts if part).strip()

    if isinstance(content, dict):
        text_value = content.get("text")
        if text_value is not None:
            return _coerce_response_content(text_value)

        if isinstance(content.get("parts"), list):
            return _coerce_response_content(content["parts"])

    text_value = getattr(content, "text", None)
    if text_value is not None:
        return _coerce_response_content(text_value)

    parts = getattr(content, "parts", None)
    if isinstance(parts, list):
        return _coerce_response_content(parts)

    return str(content).strip()


def _strip_markdown_fences(output: str) -> str:
    cleaned = output.strip()
    fence_pattern = re.compile(r"^```(?:hcl|terraform)?\s*|\s*```$", re.IGNORECASE)
    return fence_pattern.sub("", cleaned).strip()


def _resolve_model_name(model_name: str) -> str:
    return MODEL_NAME_ALIASES.get(model_name, model_name)


def _request_gemini_response(user_request: str, api_key: str) -> str:
    from google import genai

    client_kwargs: dict[str, Any] = {"api_key": api_key}
    api_version = os.getenv("GEMINI_API_VERSION")
    if api_version:
        client_kwargs["http_options"] = {"api_version": api_version}

    model_name = _resolve_model_name(os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL))
    with genai.Client(**client_kwargs) as client:
        response = client.models.generate_content(
            model=model_name,
            contents=_build_prompt(user_request),
            config={"temperature": 0},
        )

    return _strip_markdown_fences(_coerce_response_content(response))


def _build_model_failure_message(error: Exception) -> str:
    detail = str(error).strip()
    if detail:
        return (
            "The model request could not complete cleanly "
            f"({type(error).__name__}: {detail}). Using the safe fallback Terraform "
            "document instead."
        )

    return (
        "The model request could not complete cleanly. Using the safe fallback "
        "Terraform document instead."
    )


def generate_terraform_result(user_request: str) -> GenerationResult:
    if not user_request.strip():
        raise ValueError("A natural-language infrastructure request is required.")

    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return GenerationResult(
            terraform=FALLBACK_TERRAFORM,
            used_fallback=True,
            message=(
                "No Gemini API key is configured. Using the safe fallback Terraform "
                "document instead of a live model response."
            ),
        )

    try:
        cleaned = _request_gemini_response(user_request, api_key)
        if cleaned:
            return GenerationResult(
                terraform=cleaned,
                used_fallback=False,
                message=(
                    "Terraform generated successfully from the Gemini-backed model."
                ),
            )

        return GenerationResult(
            terraform=FALLBACK_TERRAFORM,
            used_fallback=True,
            message=(
                "The model returned an empty response. Using the safe fallback "
                "Terraform document instead."
            ),
        )
    except Exception as error:
        return GenerationResult(
            terraform=FALLBACK_TERRAFORM,
            used_fallback=True,
            message=_build_model_failure_message(error),
        )


def generate_terraform(user_request: str) -> str:
    return generate_terraform_result(user_request).terraform


__all__ = [
    "GenerationResult",
    "generate_terraform",
    "generate_terraform_result",
    "is_api_key_configured",
]
