import json
import logging

import httpx

from app.schemas import RepositoryAnalysis
from app.services.ai.provider import AIProvider, chat_message_content, parse_ai_analysis, provider_error_detail
from app.services.ai.schemas import AIAnalysisOutput, AIProviderError, ProviderMetadata


SYSTEM_INSTRUCTION = """You are the AI Reasoning Agent of RepoMind AI. You are analyzing the repository described in the supplied deterministic analysis. Use the supplied facts to explain what this repository does. The repository analysis is authoritative. Do not answer 'Not available from current repository analysis.' when the information is present in the supplied context. Only use that phrase when the supplied context genuinely lacks the information. Never invent repository information, files, technologies, vulnerabilities, bugs, dependencies, architecture components, installation commands, or functionality. Return ONLY valid JSON. Do not use Markdown, code fences, or explanations before or after the JSON."""
logger = logging.getLogger(__name__)


class GroqProvider(AIProvider):
    url = "https://api.groq.com/openai/v1/chat/completions"

    def __init__(self, api_key: str | None, model: str, timeout: float = 30.0):
        self.api_key = api_key
        self.metadata = ProviderMetadata(provider="groq", model=model)
        self.timeout = timeout

    async def analyze_repository(self, context: dict, repository: RepositoryAnalysis) -> AIAnalysisOutput:
        if not self.api_key:
            raise AIProviderError("AI_NOT_CONFIGURED", "Groq API key is not configured.", "groq", self.metadata.model)
        prompt = f"{SYSTEM_INSTRUCTION}\n\nReturn exactly one JSON object with repository_summary, purpose, functionalities, architecture_summary, security_summary, bug_risk_summary, documentation_summary, key_findings, recommendations, installation, usage, and limitations. Use empty arrays when there are no items.\n\nCompact repository analysis context:\n{json.dumps(context, separators=(',', ':'))}"
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.post(self.url, headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}, json={"model": self.metadata.model, "temperature": 0.2, "max_completion_tokens": 1500, "response_format": {"type": "json_object"}, "messages": [{"role": "system", "content": SYSTEM_INSTRUCTION}, {"role": "user", "content": prompt}]})
                response.raise_for_status()
                payload = response.json()
        except httpx.TimeoutException as error:
            raise AIProviderError("AI_TIMEOUT", "Groq request timed out.", "groq", self.metadata.model) from error
        except httpx.HTTPStatusError as error:
            status_code = error.response.status_code
            code = "AI_RATE_LIMIT" if status_code == 429 else "AI_REQUEST_TOO_LARGE" if status_code == 413 else "AI_PROVIDER_ERROR"
            message = "Groq rate limit reached. Please retry after the rate-limit window." if status_code == 429 else "AI request was too large. Reduce the analysis context." if status_code == 413 else "Groq is temporarily unavailable." if 500 <= status_code < 600 else provider_error_detail(error.response, "groq", self.api_key)
            raise AIProviderError(code, message, "groq", self.metadata.model) from error
        except (httpx.HTTPError, ValueError) as error:
            raise AIProviderError("AI_PROVIDER_ERROR", f"Groq request failed: {type(error).__name__}.", "groq", self.metadata.model) from error
        try:
            content = chat_message_content(payload["choices"][0]["message"])
            logger.warning(
                "Groq response http_status=%s model=%s response_content_length=%s response_content_preview=%s",
                response.status_code,
                self.metadata.model,
                len(content) if isinstance(content, str) else len(json.dumps(content, separators=(",", ":"))),
                content[:1000] if isinstance(content, str) else str(content)[:1000],
            )
            result = parse_ai_analysis(
                content,
                {"provider": "groq", "model": self.metadata.model, "status": "completed"},
            )
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise AIProviderError("AI_INVALID_RESPONSE", "Groq returned an invalid AI response.", "groq", self.metadata.model) from error
        result = result.model_copy(update={"provider": "groq", "model": self.metadata.model, "status": "completed"})
        logger.warning(
            "Groq parsed result populated repository_summary=%s purpose=%s architecture_summary=%s security_summary=%s bug_risk_summary=%s recommendations=%s",
            bool(result.repository_summary and result.repository_summary != "Not available from current repository analysis."),
            bool(result.purpose and result.purpose != "Not available from current repository analysis."),
            bool(result.architecture_summary and result.architecture_summary != "Not available from current repository analysis."),
            bool(result.security_summary and result.security_summary != "Not available from current repository analysis."),
            bool(result.bug_risk_summary and result.bug_risk_summary != "Not available from current repository analysis."),
            len(result.recommendations),
        )
        return result
