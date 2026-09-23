import json
import logging

import httpx

from app.schemas import RepositoryAnalysis
from app.services.ai.provider import AIProvider, provider_error_detail
from app.services.ai.schemas import AIAnalysisOutput, AIProviderError, ProviderMetadata


SYSTEM_INSTRUCTION = """You are RepoMind's evidence-bound reasoning layer. Use only the supplied deterministic repository analysis. Never invent files, functions, vulnerabilities, dependencies, technologies, installation commands, usage instructions, or numerical scores. When evidence is absent, write exactly: Not available from the current repository analysis. Return only valid JSON matching the requested schema."""
JSON_INSTRUCTION = """Return ONLY valid JSON. Do not use markdown. Do not wrap the JSON in ```json fences. Do not add explanations before or after the JSON. Every field must be present. Use empty arrays when there are no findings. Use 'Not available from current repository analysis.' when the deterministic analysis does not contain enough information. Never invent repository facts."""
NOT_AVAILABLE = "Not available from current repository analysis."
logger = logging.getLogger(__name__)


def _extract_gemini_text(response: dict) -> tuple[str, int, int]:
    candidates = response.get("candidates")
    candidate_count = len(candidates) if isinstance(candidates, list) else 0
    if not isinstance(candidates, list) or not candidates:
        raise ValueError("Gemini response has no candidates")
    content = candidates[0].get("content", {})
    parts = content.get("parts", []) if isinstance(content, dict) else []
    text = "".join(
        part.get("text", "")
        for part in parts
        if isinstance(part, dict) and isinstance(part.get("text"), str)
    ).strip()
    if not text:
        raise ValueError("Gemini response has no generated text")
    return text, candidate_count, len(parts)


def _normalize_gemini_result(result: dict) -> dict:
    list_fields = (
        "functionalities", "technology_stack", "entry_points", "security_priorities",
        "high_risk_areas", "key_findings", "recommendations", "installation", "usage",
        "important_files", "limitations",
    )
    string_fields = (
        "repository_summary", "purpose", "project_type", "architecture_summary",
        "architecture_pattern", "security_summary", "bug_risk_summary",
        "code_quality_summary", "documentation_summary", "executive_summary",
    )
    normalized = dict(result)
    for field in list_fields:
        value = normalized.get(field)
        if value is None:
            normalized[field] = []
        elif isinstance(value, str):
            normalized[field] = [value]
    for field in string_fields:
        if normalized.get(field) is None:
            normalized[field] = NOT_AVAILABLE
    return normalized


def extract_json_from_gemini_response(response: dict) -> dict:
    text, _, _ = _extract_gemini_text(response)
    if "```" in text:
        text = text.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("Gemini response has no JSON object")
    parsed = json.loads(text[start:end + 1])
    if not isinstance(parsed, dict):
        raise ValueError("Gemini response JSON is not an object")
    return _normalize_gemini_result(parsed)


class GeminiProvider(AIProvider):
    base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, api_key: str | None, model: str, timeout: float = 45.0):
        self.api_key = api_key
        self.metadata = ProviderMetadata(provider="gemini", model=model)
        self.timeout = timeout

    async def analyze_repository(self, context: dict, repository: RepositoryAnalysis) -> AIAnalysisOutput:
        if not self.api_key:
            raise AIProviderError("AI_NOT_CONFIGURED", "Gemini API key is not configured.", "gemini", self.metadata.model)
        prompt = f"{SYSTEM_INSTRUCTION}\n\n{JSON_INSTRUCTION}\n\nReturn a JSON object with these fields: repository_summary, purpose, project_type, functionalities, technology_stack, architecture_summary, architecture_pattern, entry_points, security_summary, security_priorities, bug_risk_summary, high_risk_areas, code_quality_summary, documentation_summary, key_findings, recommendations, installation, usage, limitations, important_files, executive_summary.\n\nRepository evidence:\n{json.dumps(context, separators=(',', ':'))}"
        url = f"{self.base_url}/{self.metadata.model}:generateContent"
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.post(url, params={"key": self.api_key}, json={"systemInstruction": {"parts": [{"text": f"{SYSTEM_INSTRUCTION}\n\n{JSON_INSTRUCTION}"}]}, "contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseMimeType": "application/json"}})
                response.raise_for_status()
                payload = response.json()
        except httpx.TimeoutException as error:
            raise AIProviderError("AI_TIMEOUT", "Gemini request timed out.", "gemini", self.metadata.model) from error
        except httpx.HTTPStatusError as error:
            raise AIProviderError("AI_PROVIDER_ERROR", provider_error_detail(error.response, "gemini", self.api_key), "gemini", self.metadata.model) from error
        except (httpx.HTTPError, ValueError) as error:
            raise AIProviderError("AI_PROVIDER_ERROR", f"Gemini request failed: {type(error).__name__}.", "gemini", self.metadata.model) from error
        try:
            extracted_text, candidate_count, part_count = _extract_gemini_text(payload)
        except (KeyError, IndexError, TypeError, ValueError):
            candidates = payload.get("candidates") if isinstance(payload, dict) else None
            candidate_count = len(candidates) if isinstance(candidates, list) else 0
            part_count = 0
            extracted_text = ""
            if candidate_count:
                content = candidates[0].get("content", {})
                parts = content.get("parts", []) if isinstance(content, dict) else []
                part_count = len(parts) if isinstance(parts, list) else 0
        diagnostic = (
            "Gemini response status=%s candidates=%s content_parts=%s "
            "extracted_text_length=%s extracted_text_preview=%s"
        )
        diagnostic_values = (
            response.status_code,
            candidate_count > 0,
            part_count,
            len(extracted_text),
            extracted_text[:500],
        )
        logger.warning(diagnostic, *diagnostic_values)
        print("GEMINI_DIAGNOSTIC " + diagnostic % diagnostic_values, flush=True)
        try:
            result = AIAnalysisOutput.model_validate(extract_json_from_gemini_response(payload))
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise AIProviderError("AI_INVALID_RESPONSE", "Gemini returned text that could not be parsed as the expected JSON structure.", "gemini", self.metadata.model) from error
        return result.model_copy(update={"provider": "gemini", "model": self.metadata.model, "status": "completed"})
