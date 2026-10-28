from abc import ABC, abstractmethod
import json
import re

from app.schemas import RepositoryAnalysis
from app.services.ai.schemas import AIAnalysisOutput, ProviderMetadata

NOT_AVAILABLE = "Not available from current repository analysis."


def _normalize_ai_result(value: dict) -> dict:
    normalized = dict(value)
    list_fields = (
        "functionalities", "technology_stack", "entry_points", "security_priorities",
        "high_risk_areas", "key_findings", "recommendations", "installation", "usage",
        "important_files", "limitations",
    )
    for field in list_fields:
        field_value = normalized.get(field)
        if field_value is None:
            normalized[field] = []
        elif isinstance(field_value, str):
            normalized[field] = [field_value]
        elif isinstance(field_value, dict):
            normalized[field] = [json.dumps(field_value, separators=(",", ":"))]
    string_fields = (
        "repository_summary", "purpose", "project_type", "architecture_summary",
        "architecture_pattern", "security_summary", "bug_risk_summary",
        "code_quality_summary", "documentation_summary", "executive_summary",
    )
    for field in string_fields:
        field_value = normalized.get(field)
        if isinstance(field_value, (dict, list)):
            normalized[field] = json.dumps(field_value, separators=(",", ":"))
        elif field_value is not None and not isinstance(field_value, str):
            normalized[field] = str(field_value)
    return normalized


def parse_ai_analysis(content: object, defaults: dict[str, object] | None = None) -> AIAnalysisOutput:
    """Extract and validate an AI JSON object without inventing missing fields."""
    if isinstance(content, list):
        content = "".join(
            item.get("text", "") for item in content if isinstance(item, dict)
        )
    if not isinstance(content, str):
        raise ValueError("AI response content is not text")

    cleaned = re.sub(r"<think>.*?</think>", "", content, flags=re.IGNORECASE | re.DOTALL).strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned, flags=re.IGNORECASE | re.DOTALL)
    if fenced:
        cleaned = fenced.group(1).strip()

    decoder = json.JSONDecoder()
    for position, character in enumerate(cleaned):
        if character != "{":
            continue
        try:
            candidate, _ = decoder.raw_decode(cleaned[position:])
        except json.JSONDecodeError:
            continue
        if not isinstance(candidate, dict):
            continue
        candidates = []
        for wrapper in ("analysis", "result", "data", "output"):
            wrapped = candidate.get(wrapper)
            if isinstance(wrapped, dict):
                candidates.append(wrapped)
        candidates.append(candidate)
        validated: list[tuple[int, AIAnalysisOutput]] = []
        for item in candidates:
            try:
                normalized = _normalize_ai_result(item)
                if defaults:
                    string_fields = (
                        "repository_summary", "purpose", "project_type", "architecture_summary",
                        "architecture_pattern", "security_summary", "bug_risk_summary",
                        "code_quality_summary", "documentation_summary", "executive_summary",
                    )
                    for field in string_fields:
                        if normalized.get(field) is None:
                            normalized[field] = NOT_AVAILABLE
                    normalized = {**defaults, **normalized}
                result = AIAnalysisOutput.model_validate(normalized)
                meaningful_fields = (
                    result.repository_summary, result.purpose, result.project_type,
                    result.architecture_summary, result.security_summary,
                    result.bug_risk_summary, result.documentation_summary,
                    result.executive_summary,
                )
                score = sum(
                    bool(value and value != NOT_AVAILABLE) for value in meaningful_fields
                ) + sum(
                    bool(getattr(result, field))
                    for field in ("functionalities", "key_findings", "recommendations")
                )
                validated.append((score, result))
            except ValueError:
                continue
        if validated:
            return max(validated, key=lambda item: item[0])[1]
        break
    raise ValueError("AI response did not contain a valid structured analysis")


def chat_message_content(message: object) -> object:
    """Read text or tool-call arguments from an OpenAI-compatible message."""
    if not isinstance(message, dict):
        raise ValueError("AI response message is not an object")
    content = message.get("content")
    if content:
        return content
    tool_calls = message.get("tool_calls")
    if isinstance(tool_calls, list) and tool_calls:
        function = tool_calls[0].get("function", {})
        if isinstance(function, dict) and function.get("arguments"):
            return function["arguments"]
    raise ValueError("AI response did not contain content")


def provider_error_detail(response, provider: str, api_key: str | None) -> str:
    """Return a bounded provider error without credentials or request URLs."""
    try:
        payload = response.json()
        error = payload.get("error", payload) if isinstance(payload, dict) else {}
        status = error.get("status") or error.get("type") or response.status_code
        message = error.get("message") or error.get("error") or response.reason_phrase
        detail = f"{provider} HTTP {response.status_code} {status}: {message}"
    except (ValueError, AttributeError):
        detail = f"{provider} HTTP {response.status_code}: {response.reason_phrase}"
    if api_key:
        detail = detail.replace(api_key, "[REDACTED]")
    return re.sub(r"https?://\S+", "[URL REDACTED]", detail)[:500]


class AIProvider(ABC):
    metadata: ProviderMetadata

    @abstractmethod
    async def analyze_repository(
        self, context: dict, repository: RepositoryAnalysis
    ) -> AIAnalysisOutput:
        """Generate validated structured reasoning from deterministic evidence."""
        raise NotImplementedError
