from __future__ import annotations

import sys
from types import ModuleType, SimpleNamespace

import pytest

from backend.ai_generator import (
    FALLBACK_TERRAFORM,
    _strip_markdown_fences,
    generate_terraform,
    generate_terraform_result,
)


def _install_fake_genai_module(
    monkeypatch: pytest.MonkeyPatch, *, response=None, error=None
):
    class FakeModels:
        calls: list[dict[str, object]] = []

        def generate_content(self, **kwargs):
            type(self).calls.append(kwargs)
            if error is not None:
                raise error
            if isinstance(response, str | list | dict) or response is None:
                return SimpleNamespace(text=response)
            return response

    class FakeClient:
        init_kwargs: dict[str, object] | None = None

        def __init__(self, **kwargs):
            type(self).init_kwargs = kwargs
            self.models = FakeModels()

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, traceback):
            return False

    google_module = ModuleType("google")
    google_module.__path__ = []
    genai_module = ModuleType("google.genai")
    genai_module.Client = FakeClient
    google_module.genai = genai_module

    monkeypatch.setitem(sys.modules, "google", google_module)
    monkeypatch.setitem(sys.modules, "google.genai", genai_module)
    return FakeClient, FakeModels


def test_strip_markdown_fences_removes_hcl_wrapper() -> None:
    wrapped = '```hcl\nresource "aws_s3_bucket" "demo" {}\n```'
    assert _strip_markdown_fences(wrapped) == 'resource "aws_s3_bucket" "demo" {}'


def test_generate_terraform_rejects_empty_requests() -> None:
    with pytest.raises(ValueError, match="natural-language infrastructure request"):
        generate_terraform("   ")


def test_generate_terraform_returns_fallback_without_api_key(monkeypatch) -> None:
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    assert generate_terraform("Create an EC2 instance") == FALLBACK_TERRAFORM


def test_generate_terraform_result_reports_missing_api_key(monkeypatch) -> None:
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    result = generate_terraform_result("Create an EC2 instance")

    assert result.terraform == FALLBACK_TERRAFORM
    assert result.used_fallback is True
    assert "No Gemini API key" in result.message


def test_generate_terraform_returns_cleaned_model_output(monkeypatch) -> None:
    fake_client, fake_models = _install_fake_genai_module(
        monkeypatch,
        response='```terraform\nresource "aws_s3_bucket" "demo" {}\n```',
    )
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_MODEL", "gemini-test-model")

    generated = generate_terraform("Create an AWS S3 bucket")

    assert generated == 'resource "aws_s3_bucket" "demo" {}'
    assert fake_client.init_kwargs == {"api_key": "test-key"}
    assert fake_models.calls == [
        {
            "model": "gemini-test-model",
            "contents": (
                "You generate a single Terraform configuration file for AWS.\n\n"
                "Return only valid Terraform HCL.\n"
                "Do not return Markdown fences.\n"
                "Do not explain the output.\n"
                "Keep the file in one Terraform document suitable for `main.tf`.\n"
                "Prefer a minimal but coherent configuration that matches the "
                "request.\n\n"
                "User request:\n"
                "Create an AWS S3 bucket"
            ),
            "config": {"temperature": 0},
        }
    ]


def test_generate_terraform_builds_aws_single_file_prompt(monkeypatch) -> None:
    _, fake_models = _install_fake_genai_module(
        monkeypatch,
        response='resource "aws_s3_bucket" "demo" {}',
    )
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    generate_terraform("Create an AWS S3 bucket")

    assert len(fake_models.calls) == 1
    prompt = fake_models.calls[0]["contents"]
    assert "single Terraform configuration file for AWS" in prompt
    assert "Do not return Markdown fences." in prompt
    assert "suitable for `main.tf`" in prompt
    assert "Create an AWS S3 bucket" in prompt


def test_generate_terraform_coerces_structured_response_content(monkeypatch) -> None:
    fake_response = [
        {"text": "```hcl"},
        {"text": 'resource "aws_s3_bucket" "demo" {}'},
        "```",
    ]
    _install_fake_genai_module(monkeypatch, response=fake_response)
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    generated = generate_terraform("Create an AWS S3 bucket")

    assert generated == 'resource "aws_s3_bucket" "demo" {}'


def test_generate_terraform_returns_fallback_for_empty_model_output(
    monkeypatch,
) -> None:
    _install_fake_genai_module(monkeypatch, response="```hcl\n\n```")
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    assert generate_terraform("Create an AWS S3 bucket") == FALLBACK_TERRAFORM


def test_generate_terraform_returns_fallback_when_model_fails(monkeypatch) -> None:
    _install_fake_genai_module(monkeypatch, error=RuntimeError("network unavailable"))
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    assert generate_terraform("Create an AWS S3 bucket") == FALLBACK_TERRAFORM


def test_generate_terraform_result_reports_success(monkeypatch) -> None:
    _install_fake_genai_module(
        monkeypatch,
        response='resource "aws_s3_bucket" "demo" {}',
    )
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    result = generate_terraform_result("Create an AWS S3 bucket")

    assert result.terraform == 'resource "aws_s3_bucket" "demo" {}'
    assert result.used_fallback is False
    assert "generated successfully" in result.message


def test_generate_terraform_resolves_gemini_3_flash_alias(monkeypatch) -> None:
    _, fake_models = _install_fake_genai_module(
        monkeypatch,
        response='resource "aws_s3_bucket" "demo" {}',
    )
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_MODEL", "gemini-3-flash")

    generate_terraform("Create an AWS S3 bucket")

    assert fake_models.calls[0]["model"] == "gemini-3-flash-preview"


def test_generate_terraform_passes_configured_api_version(monkeypatch) -> None:
    fake_client, _ = _install_fake_genai_module(
        monkeypatch,
        response='resource "aws_s3_bucket" "demo" {}',
    )
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_VERSION", "v1")

    generate_terraform("Create an AWS S3 bucket")

    assert fake_client.init_kwargs == {
        "api_key": "test-key",
        "http_options": {"api_version": "v1"},
    }


def test_generate_terraform_result_reports_model_failure_details(monkeypatch) -> None:
    _install_fake_genai_module(monkeypatch, error=RuntimeError("model not found"))
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    result = generate_terraform_result("Create an AWS S3 bucket")

    assert result.terraform == FALLBACK_TERRAFORM
    assert result.used_fallback is True
    assert "RuntimeError: model not found" in result.message
