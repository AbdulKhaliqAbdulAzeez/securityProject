from __future__ import annotations

import streamlit as st

from ai_generator import generate_terraform, is_api_key_configured
from tf_validator import validate_terraform

DEFAULT_PROMPT = (
    "Create a highly available AWS EC2 web server with an application load "
    "balancer and a security group that allows HTTP traffic."
)
DEFAULT_CODE_PLACEHOLDER = "# Generated Terraform will appear here."
DEFAULT_LOG_PLACEHOLDER = "Validation output will appear here after submission."
GENERATION_FAILURE_MESSAGE = (
    "Terraform generation failed before validation could start. Review the "
    "local model configuration and retry."
)
VALIDATION_FAILURE_MESSAGE = (
    "Terraform validation could not complete. Review local Terraform setup and retry."
)


def _initialize_session_state() -> None:
    st.session_state.setdefault("generated_code", DEFAULT_CODE_PLACEHOLDER)
    st.session_state.setdefault("validation_log", DEFAULT_LOG_PLACEHOLDER)
    st.session_state.setdefault("validation_success", None)


def _record_workflow_failure(message: str, *, generated_code: str) -> None:
    st.session_state["generated_code"] = generated_code
    st.session_state["validation_log"] = message
    st.session_state["validation_success"] = False


def _format_workflow_error(message: str, error: Exception) -> str:
    return f"{message}\n\nerror type: {type(error).__name__}"


def _render_sidebar() -> None:
    with st.sidebar:
        st.header("MVP Guardrails")
        st.markdown(
            "\n".join(
                [
                    "- AWS-only Terraform generation",
                    "- Gemini-first integration path",
                    "- Validation only: no apply or destroy",
                    "- Local Terraform CLI required for validation",
                ]
            )
        )

        if is_api_key_configured():
            st.success("Gemini API key detected.")
        else:
            st.info(
                "No Gemini API key detected. The app will use a safe fallback "
                "Terraform document until GOOGLE_API_KEY or GEMINI_API_KEY is set."
            )

        st.warning(
            "Terraform must be installed locally and available on PATH for the "
            "validation panel to show live fmt/init/validate results."
        )


def _handle_submission(user_request: str) -> None:
    if not user_request.strip():
        st.warning("Enter an infrastructure request before running the workflow.")
        return

    with st.status("Running generation and validation", expanded=True) as status:
        status.write("Generating Terraform from the natural-language prompt")
        try:
            terraform_code = generate_terraform(user_request)
        except Exception as error:
            _record_workflow_failure(
                _format_workflow_error(GENERATION_FAILURE_MESSAGE, error),
                generated_code=DEFAULT_CODE_PLACEHOLDER,
            )
            status.update(label="Generation failed", state="error")
            return

        status.write(
            "Running terraform fmt, init, and validate in a temporary workspace"
        )
        try:
            validation_result = validate_terraform(terraform_code)
        except Exception as error:
            _record_workflow_failure(
                _format_workflow_error(VALIDATION_FAILURE_MESSAGE, error),
                generated_code=terraform_code,
            )
            status.update(label="Validation failed", state="error")
            return

        st.session_state["generated_code"] = validation_result.formatted_code
        st.session_state["validation_log"] = validation_result.combined_log()
        st.session_state["validation_success"] = validation_result.success

        if validation_result.success:
            status.update(label="Validation passed", state="complete")
        else:
            status.update(label="Validation completed with errors", state="error")


def main() -> None:
    st.set_page_config(
        page_title="AI-Powered Terraform Architect & Validator",
        page_icon=":material/cloud:",
        layout="wide",
    )
    _initialize_session_state()
    _render_sidebar()

    st.title("AI-Powered Terraform Architect & Validator")
    st.write(
        "Describe the AWS infrastructure you want, generate Terraform, and run a "
        "local validation loop without leaving the browser."
    )

    user_request = st.text_area(
        "Infrastructure request",
        value=DEFAULT_PROMPT,
        height=180,
        placeholder="Describe the cloud infrastructure you want Terraform to create.",
    )
    st.button(
        "Generate and validate",
        type="primary",
        use_container_width=True,
        on_click=_handle_submission,
        args=(user_request,),
    )

    code_column, log_column = st.columns(2)

    with code_column:
        st.subheader("Generated Terraform")
        st.code(st.session_state["generated_code"], language="hcl")

    with log_column:
        st.subheader("Validation Output")
        validation_success = st.session_state["validation_success"]
        if validation_success is True:
            st.success("Terraform validation passed.")
        elif validation_success is False:
            st.error("Terraform validation failed. Review the logs below.")

        st.code(st.session_state["validation_log"], language="text")


if __name__ == "__main__":
    main()
