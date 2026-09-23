import json
import logging

import httpx

from app.schemas import RepositoryAnalysis
from app.services.ai.provider import AIProvider, chat_message_content, parse_ai_analysis, provider_error_detail
from app.services.ai.schemas import AIAnalysisOutput, AIProviderError, ProviderMetadata


SYSTEM_INSTRUCTION = """You are the AI Reasoning Agent of RepoMind AI.

Analyze the supplied deterministic repository analysis and produce useful developer intelligence.

You MUST ONLY use information present in the supplied analysis. Never invent files, technologies, vulnerabilities, bugs, dependencies, architecture components, installation commands, or functionality.

If information is unavailable, explicitly say: Not available from current repository analysis.

RETURN ONLY A SINGLE VALID JSON OBJECT. Do not use Markdown. Do not use ```json. Do not add explanations before or after the JSON.

Return exactly the requested AI reasoning structure. Use empty arrays when there are no items. Never invent facts."""
OUTPUT_FIELDS = "repository_summary, purpose, project_type, functionalities, technology_stack, architecture_summary, architecture_pattern, entry_points, security_summary, security_priorities, bug_risk_summary, high_risk_areas, code_quality_summary, documentation_summary, key_findings, recommendations, installation, usage, limitations, important_files, executive_summary"
logger = logging.getLogger(__name__)


class OpenRouterProvider(AIProvider):
    base_url = "https://openrouter.ai/api/v1"

    def __init__(self, api_key: str | None, model: str, timeout: float = 60.0):
        self.api_key = api_key
        self.metadata = ProviderMetadata(provider="openrouter", model=model)
        self.timeout = timeout

    async def analyze_repository(self, context: dict, repository: RepositoryAnalysis) -> AIAnalysisOutput:
        if not self.api_key:
            raise AIProviderError("AI_NOT_CONFIGURED", "OpenRouter API key is not configured.", "openrouter", self.metadata.model)
        prompt = f"{SYSTEM_INSTRUCTION}\n\nEvery field must be present. The fields are: {OUTPUT_FIELDS}.\nRequired JSON fields include repository_summary, purpose, functionalities, architecture_summary, security_summary, bug_risk_summary, documentation_summary, key_findings, recommendations, installation, usage, and limitations.\n\nCompact deterministic repository analysis:\n{json.dumps(context, separators=(',', ':'))}"
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": "http://localhost:5173",
                        "X-Title": "RepoMind AI",
                    },
                    json={
                        "model": self.metadata.model,
                        "temperature": 0.2,
                        "max_tokens": 3000,
                        "response_format": {"type": "json_object"},
                        "messages": [
                            {"role": "system", "content": SYSTEM_INSTRUCTION},
                            {"role": "user", "content": prompt},
                        ],
                    },
                )
                response.raise_for_status()
                logger.info(
                    "AI provider response provider=%s model=%s timeout=%ss response_length=%s http_status=%s",
                    self.metadata.provider,
                    self.metadata.model,
                    self.timeout,
                    len(getattr(response, "content", b"")),
                    response.status_code,
                )
                payload = response.json()
        except httpx.TimeoutException as error:
            logger.warning(
                "AI provider response provider=%s model=%s timeout=%ss response_length=%s http_status=%s",
                self.metadata.provider,
                self.metadata.model,
                self.timeout,
                0,
                "timeout",
            )
            raise AIProviderError("AI_TIMEOUT", "OpenRouter request timed out.", "openrouter", self.metadata.model) from error
        except httpx.HTTPStatusError as error:
            status_code = error.response.status_code
            logger.warning(
                "AI provider response provider=%s model=%s timeout=%ss response_length=%s http_status=%s",
                self.metadata.provider,
                self.metadata.model,
                self.timeout,
                len(error.response.content),
                status_code,
            )
            code = "AI_RATE_LIMIT" if status_code == 429 else "AI_AUTH_ERROR" if status_code == 401 else "AI_PROVIDER_ERROR"
            message = "OpenRouter rate limit reached." if status_code == 429 else "OpenRouter authentication failed." if status_code == 401 else "OpenRouter is temporarily unavailable." if 500 <= status_code < 600 else provider_error_detail(error.response, "openrouter", self.api_key)
            raise AIProviderError(code, message, "openrouter", self.metadata.model) from error
        except (httpx.HTTPError, ValueError) as error:
            raise AIProviderError("AI_PROVIDER_ERROR", f"OpenRouter request failed: {type(error).__name__}.", "openrouter", self.metadata.model) from error
        try:
            content = chat_message_content(payload["choices"][0]["message"])
            result = parse_ai_analysis(content)
        except (KeyError, IndexError, TypeError, ValueError) as error:
            raise AIProviderError("AI_INVALID_RESPONSE", "OpenRouter returned an invalid AI response.", "openrouter", self.metadata.model) from error
        return result.model_copy(update={"provider": "openrouter", "model": self.metadata.model, "status": "completed"})