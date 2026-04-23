from __future__ import annotations

import sys
from types import SimpleNamespace

import pytest

from ai_generator import FALLBACK_TERRAFORM, _strip_markdown_fences, generate_terraform


def _install_fake_genai_module(
    monkeypatch: pytest.MonkeyPatch, *, response=None, error=None
):
    class FakeChatGoogleGenerativeAI:
        init_kwargs: dict[str, object] | None = None
        prompts: list[str] = []

        def __init__(self, **kwargs):
            type(self).init_kwargs = kwargs

        def invoke(self, prompt: str):
            type(self).prompts.append(prompt)
            if error is not None:
                raise error
            return SimpleNamespace(content=response)

    fake_module = SimpleNamespace(ChatGoogleGenerativeAI=FakeChatGoogleGenerativeAI)
    monkeypatch.setitem(sys.modules, "langchain_google_genai", fake_module)
    return FakeChatGoogleGenerativeAI


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


def test_generate_terraform_returns_cleaned_model_output(monkeypatch) -> None:
    fake_model = _install_fake_genai_module(
        monkeypatch,
        response='```terraform\nresource "aws_s3_bucket" "demo" {}\n```',
    )
    monkeypatch.setenv("GOOGLE_API_KEY", "test-key")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_MODEL", "gemini-test-model")

    generated = generate_terraform("Create an AWS S3 bucket")

    assert generated == 'resource "aws_s3_bucket" "demo" {}'
    assert fake_model.init_kwargs == {
        "model": "gemini-test-model",
        "google_api_key": "test-key",
        "temperature": 0,
    }
    assert len(fake_model.prompts) == 1
    assert "Create an AWS S3 bucket" in fake_model.prompts[0]


def test_generate_terraform_builds_aws_single_file_prompt(monkeypatch) -> None:
    fake_model = _install_fake_genai_module(
        monkeypatch,
        response='resource "aws_s3_bucket" "demo" {}',
    )
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    generate_terraform("Create an AWS S3 bucket")

    assert len(fake_model.prompts) == 1
    prompt = fake_model.prompts[0]
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
