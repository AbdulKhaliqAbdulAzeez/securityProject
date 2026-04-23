from __future__ import annotations

from dataclasses import dataclass

from backend import streamlit_app


@dataclass
class FakeValidationResult:
    success: bool
    formatted_code: str
    log_output: str

    def combined_log(self) -> str:
        return self.log_output


class FakeStatus:
    def __init__(self, label: str, expanded: bool) -> None:
        self.label = label
        self.expanded = expanded
        self.writes: list[str] = []
        self.updates: list[dict[str, str]] = []

    def __enter__(self) -> FakeStatus:
        return self

    def __exit__(self, exc_type, exc, tb) -> bool:
        return False

    def write(self, message: str) -> None:
        self.writes.append(message)

    def update(self, **kwargs: str) -> None:
        self.updates.append(kwargs)


class FakeStreamlit:
    def __init__(self) -> None:
        self.session_state: dict[str, object] = {}
        self.warning_messages: list[str] = []
        self.status_calls: list[FakeStatus] = []

    def warning(self, message: str) -> None:
        self.warning_messages.append(message)

    def status(self, label: str, expanded: bool) -> FakeStatus:
        status = FakeStatus(label, expanded)
        self.status_calls.append(status)
        return status


def test_handle_submission_warns_for_blank_request(monkeypatch) -> None:
    fake_streamlit = FakeStreamlit()
    monkeypatch.setattr(streamlit_app, "st", fake_streamlit)

    streamlit_app._initialize_session_state()
    streamlit_app._handle_submission("   ")

    assert fake_streamlit.warning_messages == [
        "Enter an infrastructure request before running the workflow."
    ]
    assert (
        fake_streamlit.session_state["generated_code"]
        == streamlit_app.DEFAULT_CODE_PLACEHOLDER
    )
    assert (
        fake_streamlit.session_state["validation_log"]
        == streamlit_app.DEFAULT_LOG_PLACEHOLDER
    )
    assert fake_streamlit.session_state["validation_success"] is None


def test_handle_submission_updates_session_state_on_success(monkeypatch) -> None:
    fake_streamlit = FakeStreamlit()
    monkeypatch.setattr(streamlit_app, "st", fake_streamlit)
    monkeypatch.setattr(streamlit_app, "generate_terraform", lambda _: "resource {}")
    monkeypatch.setattr(
        streamlit_app,
        "validate_terraform",
        lambda _: FakeValidationResult(
            success=True,
            formatted_code="formatted resource {}",
            log_output="validation passed",
        ),
    )

    streamlit_app._initialize_session_state()
    streamlit_app._handle_submission("Create an AWS VPC")

    assert fake_streamlit.session_state["generated_code"] == "formatted resource {}"
    assert fake_streamlit.session_state["validation_log"] == "validation passed"
    assert fake_streamlit.session_state["validation_success"] is True
    assert fake_streamlit.status_calls[0].updates == [
        {"label": "Validation passed", "state": "complete"}
    ]


def test_handle_submission_reports_generation_failures_without_raw_details(
    monkeypatch,
) -> None:
    fake_streamlit = FakeStreamlit()
    monkeypatch.setattr(streamlit_app, "st", fake_streamlit)

    def raise_generation_error(_: str) -> str:
        raise RuntimeError("api key leaked")

    monkeypatch.setattr(streamlit_app, "generate_terraform", raise_generation_error)

    streamlit_app._initialize_session_state()
    streamlit_app._handle_submission("Create an AWS VPC")

    assert (
        fake_streamlit.session_state["generated_code"]
        == streamlit_app.DEFAULT_CODE_PLACEHOLDER
    )
    assert fake_streamlit.session_state["validation_success"] is False
    assert (
        streamlit_app.GENERATION_FAILURE_MESSAGE
        in fake_streamlit.session_state["validation_log"]
    )
    assert "error type: RuntimeError" in fake_streamlit.session_state["validation_log"]
    assert "api key leaked" not in fake_streamlit.session_state["validation_log"]
    assert fake_streamlit.status_calls[0].updates == [
        {"label": "Generation failed", "state": "error"}
    ]


def test_handle_submission_reports_validation_failures_without_raw_details(
    monkeypatch,
) -> None:
    fake_streamlit = FakeStreamlit()
    monkeypatch.setattr(streamlit_app, "st", fake_streamlit)
    monkeypatch.setattr(
        streamlit_app,
        "generate_terraform",
        lambda _: "generated resource",
    )

    def raise_validation_error(_: str) -> FakeValidationResult:
        raise RuntimeError("provider token leaked")

    monkeypatch.setattr(streamlit_app, "validate_terraform", raise_validation_error)

    streamlit_app._initialize_session_state()
    streamlit_app._handle_submission("Create an AWS VPC")

    assert fake_streamlit.session_state["generated_code"] == "generated resource"
    assert fake_streamlit.session_state["validation_success"] is False
    assert (
        streamlit_app.VALIDATION_FAILURE_MESSAGE
        in fake_streamlit.session_state["validation_log"]
    )
    assert "error type: RuntimeError" in fake_streamlit.session_state["validation_log"]
    assert "provider token leaked" not in fake_streamlit.session_state["validation_log"]
    assert fake_streamlit.status_calls[0].updates == [
        {"label": "Validation failed", "state": "error"}
    ]
