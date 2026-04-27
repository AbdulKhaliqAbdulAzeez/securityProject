from __future__ import annotations

import os
import re
import uuid
from dataclasses import dataclass


@dataclass
class GitOpsDeliveryResult:
    branch_name: str
    commit_sha: str
    pull_request_url: str
    pull_request_number: int


class GitOpsError(RuntimeError):
    """Base error for GitOps delivery failures."""


class GitOpsConfigurationError(GitOpsError):
    """Raised when required GitHub settings are missing."""


class GitOpsDeliveryError(GitOpsError):
    """Raised when GitHub branch, commit, or pull-request creation fails."""


def _create_github_client(token: str):
    from github import Github

    return Github(token)


def _read_required_setting(name: str) -> str:
    value = os.getenv(name, "").strip()
    if value:
        return value

    raise GitOpsConfigurationError(
        f"{name} is not configured. Set it before running GitOps delivery."
    )


def build_gitops_branch_name(prompt: str, unique_suffix: str | None = None) -> str:
    normalized_prompt = re.sub(r"[^a-z0-9]+", "-", prompt.lower()).strip("-")
    branch_fragment = normalized_prompt[:40] or "terraform-update"
    suffix = unique_suffix or uuid.uuid4().hex[:8]
    return f"gitops/terraform-{branch_fragment}-{suffix}"


def _build_commit_message(prompt: str) -> str:
    normalized_prompt = " ".join(prompt.split())
    short_prompt = (
        normalized_prompt[:72].rstrip() if normalized_prompt else "Terraform update"
    )
    return f"Add validated Terraform for {short_prompt}"


def _build_pull_request_title(prompt: str) -> str:
    normalized_prompt = " ".join(prompt.split())
    short_prompt = (
        normalized_prompt[:72].rstrip()
        if normalized_prompt
        else "validated Terraform update"
    )
    return f"Terraform workflow: {short_prompt}"


def _build_pull_request_body(prompt: str, branch_name: str) -> str:
    normalized_prompt = " ".join(prompt.split()) or "No prompt captured."
    return (
        "## Terraform Workflow Delivery\n\n"
        f"- Source prompt: {normalized_prompt}\n"
        f"- Delivery branch: {branch_name}\n"
        "- Validation gate: terraform fmt/init/validate and Checkov passed "
        "before delivery\n"
    )


def deliver_terraform_via_gitops(
    terraform_code: str,
    prompt: str,
) -> GitOpsDeliveryResult:
    normalized_code = terraform_code.strip()
    if not normalized_code:
        raise ValueError("Terraform code is required for GitOps delivery.")

    github_token = _read_required_setting("GITHUB_TOKEN")
    repository_name = _read_required_setting("GITHUB_REPOSITORY")
    base_branch = os.getenv("GITHUB_BASE_BRANCH", "main").strip() or "main"

    github_client = _create_github_client(github_token)
    branch_name = build_gitops_branch_name(prompt)

    try:
        repository = github_client.get_repo(repository_name)
        base_reference = repository.get_branch(base_branch)
        repository.create_git_ref(
            ref=f"refs/heads/{branch_name}",
            sha=base_reference.commit.sha,
        )

        commit_result = repository.create_file(
            path="main.tf",
            message=_build_commit_message(prompt),
            content=normalized_code + "\n",
            branch=branch_name,
        )
        pull_request = repository.create_pull(
            title=_build_pull_request_title(prompt),
            body=_build_pull_request_body(prompt, branch_name),
            head=branch_name,
            base=base_branch,
        )
    except Exception as error:  # pragma: no cover - exercised via tests with stubs
        raise GitOpsDeliveryError(
            "GitHub delivery failed. Check repository access, branch settings, "
            "and pull-request permissions."
        ) from error

    commit = commit_result.get("commit") if isinstance(commit_result, dict) else None
    commit_sha = getattr(commit, "sha", "")
    return GitOpsDeliveryResult(
        branch_name=branch_name,
        commit_sha=commit_sha,
        pull_request_url=pull_request.html_url,
        pull_request_number=pull_request.number,
    )


__all__ = [
    "GitOpsConfigurationError",
    "GitOpsDeliveryError",
    "GitOpsDeliveryResult",
    "build_gitops_branch_name",
    "deliver_terraform_via_gitops",
]
