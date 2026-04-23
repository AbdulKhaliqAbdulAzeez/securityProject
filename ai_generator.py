from __future__ import annotations

import os
import re
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

        return "\n".join(part for part in parts if part).strip()

    return str(content).strip()


def _strip_markdown_fences(output: str) -> str:
    cleaned = output.strip()
    fence_pattern = re.compile(r"^```(?:hcl|terraform)?\s*|\s*```$", re.IGNORECASE)
    return fence_pattern.sub("", cleaned).strip()


def generate_terraform(user_request: str) -> str:
    if not user_request.strip():
        raise ValueError("A natural-language infrastructure request is required.")

    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return FALLBACK_TERRAFORM

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=0,
        )
        response = llm.invoke(_build_prompt(user_request))
        cleaned = _strip_markdown_fences(_coerce_response_content(response.content))
        return cleaned or FALLBACK_TERRAFORM
    except Exception:
        return FALLBACK_TERRAFORM


__all__ = ["generate_terraform", "is_api_key_configured"]
