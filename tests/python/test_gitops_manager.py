from __future__ import annotations

from types import SimpleNamespace

import pytest

from backend import gitops_manager


def test_build_gitops_branch_name_slugifies_and_limits_length() -> None:
    branch_name = gitops_manager.build_gitops_branch_name(
        "Create a highly available AWS EC2 web server with load balancer",
        unique_suffix="abc12345",
    )

    assert branch_name == (
        "gitops/terraform-create-a-highly-available-aws-ec2-web-se-abc12345"
    )


def test_build_gitops_branch_name_falls_back_for_empty_prompt() -> None:
    branch_name = gitops_manager.build_gitops_branch_name(
        "   ",
        unique_suffix="abc12345",
    )

    assert branch_name == "gitops/terraform-terraform-update-abc12345"


def test_deliver_terraform_via_gitops_creates_branch_commit_and_pull_request(
    monkeypatch,
) -> None:
    captured: dict[str, object] = {}

    class FakeRepository:
        def get_branch(self, branch_name: str):
            captured["base_branch"] = branch_name
            return SimpleNamespace(commit=SimpleNamespace(sha="base-sha"))

        def create_git_ref(self, ref: str, sha: str):
            captured["git_ref"] = {"ref": ref, "sha": sha}

        def create_file(self, path: str, message: str, content: str, branch: str):
            captured["file"] = {
                "path": path,
                "message": message,
                "content": content,
                "branch": branch,
            }
            return {"commit": SimpleNamespace(sha="commit-sha")}

        def create_pull(self, title: str, body: str, head: str, base: str):
            captured["pull_request"] = {
                "title": title,
                "body": body,
                "head": head,
                "base": base,
            }
            return SimpleNamespace(
                html_url="https://github.example/pr/123",
                number=123,
            )

    class FakeGitHubClient:
        def get_repo(self, repository_name: str):
            captured["repository_name"] = repository_name
            return FakeRepository()

    monkeypatch.setenv("GITHUB_TOKEN", "token")
    monkeypatch.setenv("GITHUB_REPOSITORY", "octocat/infrastructure")
    monkeypatch.setenv("GITHUB_BASE_BRANCH", "main")
    monkeypatch.setattr(
        gitops_manager,
        "_create_github_client",
        lambda token: FakeGitHubClient(),
    )
    monkeypatch.setattr(
        gitops_manager.uuid,
        "uuid4",
        lambda: SimpleNamespace(hex="abc12345ff00ee11"),
    )

    result = gitops_manager.deliver_terraform_via_gitops(
        'resource "aws_s3_bucket" "demo" {}',
        "Create an AWS S3 bucket",
    )

    assert captured["repository_name"] == "octocat/infrastructure"
    assert captured["base_branch"] == "main"
    assert captured["git_ref"] == {
        "ref": "refs/heads/gitops/terraform-create-an-aws-s3-bucket-abc12345",
        "sha": "base-sha",
    }
    assert captured["file"] == {
        "path": "main.tf",
        "message": "Add validated Terraform for Create an AWS S3 bucket",
        "content": 'resource "aws_s3_bucket" "demo" {}\n',
        "branch": "gitops/terraform-create-an-aws-s3-bucket-abc12345",
    }
    assert captured["pull_request"] == {
        "title": "Terraform workflow: Create an AWS S3 bucket",
        "body": (
            "## Terraform Workflow Delivery\n\n"
            "- Source prompt: Create an AWS S3 bucket\n"
            "- Delivery branch: gitops/terraform-create-an-aws-s3-bucket-abc12345\n"
            "- Validation gate: terraform fmt/init/validate and Checkov passed "
            "before delivery\n"
        ),
        "head": "gitops/terraform-create-an-aws-s3-bucket-abc12345",
        "base": "main",
    }
    assert result.branch_name == "gitops/terraform-create-an-aws-s3-bucket-abc12345"
    assert result.commit_sha == "commit-sha"
    assert result.pull_request_url == "https://github.example/pr/123"
    assert result.pull_request_number == 123


def test_deliver_terraform_via_gitops_rejects_missing_configuration(
    monkeypatch,
) -> None:
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    monkeypatch.delenv("GITHUB_REPOSITORY", raising=False)

    with pytest.raises(
        gitops_manager.GitOpsConfigurationError,
        match="GITHUB_TOKEN is not configured",
    ):
        gitops_manager.deliver_terraform_via_gitops("terraform {}", "Create infra")


def test_deliver_terraform_via_gitops_wraps_github_errors(monkeypatch) -> None:
    class FailingGitHubClient:
        def get_repo(self, repository_name: str):
            raise RuntimeError(f"cannot access {repository_name}")

    monkeypatch.setenv("GITHUB_TOKEN", "token")
    monkeypatch.setenv("GITHUB_REPOSITORY", "octocat/infrastructure")
    monkeypatch.setattr(
        gitops_manager,
        "_create_github_client",
        lambda token: FailingGitHubClient(),
    )

    with pytest.raises(
        gitops_manager.GitOpsDeliveryError,
        match="GitHub delivery failed",
    ):
        gitops_manager.deliver_terraform_via_gitops("terraform {}", "Create infra")


def test_deliver_terraform_via_gitops_rejects_empty_terraform_code() -> None:
    with pytest.raises(ValueError, match="Terraform code is required"):
        gitops_manager.deliver_terraform_via_gitops("   ", "Create infra")
