import json

import httpx
import pytest

from app.schemas import RepositoryAnalysis
from app.services.ai.gemini_provider import GeminiProvider, extract_json_from_gemini_response
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.openrouter_provider import OpenRouterProvider
from app.services.ai.provider import chat_message_content, parse_ai_analysis
from app.services.ai.reasoning_agent import ReasoningAgent, build_reasoning_context, estimate_context_tokens
from app.services.ai.schemas import AIAnalysisOutput, AIProviderError, AIUnavailableError


class FakeProvider:
    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error
        self.calls = 0

    async def analyze_repository(self, context, repository):
        self.calls += 1
        if self.error:
            raise self.error
        return self.result


def minimal_repository():
    return RepositoryAnalysis(
        name="example", owner="owner", description=None, default_branch="main",
        stars=0, forks=0, repository_size=1, languages={},
    )


def valid_output(provider="gemini"):
    return AIAnalysisOutput(
        provider=provider, model="test-model", status="completed",
        repository_summary="summary", purpose="purpose", project_type="library",
        architecture_summary="architecture", architecture_pattern="unknown",
        security_summary="security", bug_risk_summary="risk",
        code_quality_summary="quality", documentation_summary="docs",
        executive_summary="executive",
    )


def test_provider_initialization_and_missing_keys():
    gemini = GeminiProvider(None, "gemini-test")
    openrouter = OpenRouterProvider(None, "google/gemma-4-26b-a4b-it:free")
    groq = GroqProvider(None, "groq-test")

    assert gemini.metadata.model == "gemini-test"
    assert openrouter.metadata.provider == "openrouter"
    assert openrouter.metadata.model == "google/gemma-4-26b-a4b-it:free"
    assert openrouter.timeout == 60.0
    assert groq.metadata.provider == "groq"
    with pytest.raises(AIProviderError) as error:
        import asyncio
        asyncio.run(gemini.analyze_repository({}, minimal_repository()))
    assert error.value.code == "AI_NOT_CONFIGURED"
    with pytest.raises(AIProviderError) as error:
        import asyncio
        asyncio.run(openrouter.analyze_repository({}, minimal_repository()))
    assert error.value.code == "AI_NOT_CONFIGURED"


def test_default_reasoning_agent_uses_only_groq(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    monkeypatch.setenv("GROQ_MODEL", "openai/gpt-oss-20b")

    agent = ReasoningAgent()

    assert len(agent.providers) == 1
    assert agent.providers[0].metadata.provider == "groq"
    assert agent.providers[0].metadata.model == "openai/gpt-oss-20b"
    assert agent.providers[0].timeout == 30.0


def gemini_payload(text_parts):
    return {"candidates": [{"content": {"parts": [{"text": text} for text in text_parts]}}]}


def test_gemini_response_extraction_variants():
    payload = valid_output("gemini").model_dump_json()
    assert extract_json_from_gemini_response(gemini_payload([payload]))["provider"] == "gemini"
    assert extract_json_from_gemini_response(gemini_payload([f"```json\n{payload}\n```\n"]))["status"] == "completed"
    assert extract_json_from_gemini_response(gemini_payload(["  ", payload[:30], payload[30:]]))["executive_summary"] == "executive"


@pytest.mark.parametrize(
    "response",
    [
        {"candidates": []},
        gemini_payload(["not json"]),
    ],
)
def test_gemini_invalid_response_shapes(response):
    with pytest.raises(ValueError):
        extract_json_from_gemini_response(response)


class ProviderResponse:
    def __init__(self, payload, status_code=200):
        self.payload = payload
        self.status_code = status_code
        self.reason_phrase = "error"

    def json(self):
        return self.payload

    def raise_for_status(self):
        if self.status_code >= 400:
            response = httpx.Response(self.status_code, json=self.payload)
            raise httpx.HTTPStatusError("provider error", request=httpx.Request("POST", "https://openrouter.ai"), response=response)


class ProviderClient:
    response = None
    calls = []

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, **kwargs):
        self.calls.append((url, kwargs))
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


@pytest.mark.asyncio
async def test_openrouter_request_and_success(monkeypatch):
    ProviderClient.calls = []
    output = valid_output("openrouter").model_dump()
    ProviderClient.response = ProviderResponse({"choices": [{"message": {"content": json.dumps(output)}}]})
    monkeypatch.setattr("app.services.ai.openrouter_provider.httpx.AsyncClient", ProviderClient)

    result = await OpenRouterProvider("test-key", "google/gemma-4-26b-a4b-it:free").analyze_repository({"evidence": "yes"}, minimal_repository())

    url, request = ProviderClient.calls[0]
    assert url == "https://openrouter.ai/api/v1/chat/completions"
    assert request["headers"]["Authorization"] == "Bearer test-key"
    assert request["headers"]["X-Title"] == "RepoMind AI"
    assert request["json"]["model"] == "google/gemma-4-26b-a4b-it:free"
    assert request["json"]["temperature"] == 0.2
    assert request["json"]["max_tokens"] == 3000
    assert request["json"]["response_format"] == {"type": "json_object"}
    assert result.provider == "openrouter"


@pytest.mark.asyncio
async def test_gemini_successful_structured_response(monkeypatch):
    ProviderClient.response = ProviderResponse(
        gemini_payload(["Here is the result:\n", f"```json\n{valid_output('gemini').model_dump_json()}\n```"])
    )
    monkeypatch.setattr("app.services.ai.gemini_provider.httpx.AsyncClient", ProviderClient)

    result = await GeminiProvider("test-key", "gemini-3.6-flash").analyze_repository({}, minimal_repository())

    assert result.provider == "gemini"
    assert result.model == "gemini-3.6-flash"
    assert result.status == "completed"


@pytest.mark.asyncio
async def test_gemini_normalizes_optional_fields_and_ignores_extra_fields(monkeypatch):
    output = valid_output("gemini").model_dump()
    output.pop("functionalities")
    output["key_findings"] = None
    output["recommendations"] = None
    output["unexpected_provider_field"] = "ignored"
    ProviderClient.response = ProviderResponse(gemini_payload([json.dumps(output)]))
    monkeypatch.setattr("app.services.ai.gemini_provider.httpx.AsyncClient", ProviderClient)

    result = await GeminiProvider("test-key", "gemini-3.6-flash").analyze_repository({}, minimal_repository())

    assert result.status == "completed"
    assert result.functionalities == []
    assert result.key_findings == []
    assert result.recommendations == []
    assert not hasattr(result, "unexpected_provider_field")


@pytest.mark.asyncio
async def test_gemini_invalid_response_is_controlled(monkeypatch):
    monkeypatch.setattr("app.services.ai.gemini_provider.httpx.AsyncClient", ProviderClient)

    for response in (gemini_payload(["not-json"]), gemini_payload([json.dumps({"provider": "gemini"})])):
        ProviderClient.response = ProviderResponse(response)
        with pytest.raises(AIProviderError) as error:
            await GeminiProvider("test-key", "gemini-3.6-flash").analyze_repository({}, minimal_repository())

        assert error.value.code == "AI_INVALID_RESPONSE"
        assert "could not be parsed" in error.value.message


@pytest.mark.asyncio
async def test_gemini_http_error(monkeypatch):
    ProviderClient.response = ProviderResponse({"error": {"message": "temporarily unavailable"}}, 503)
    monkeypatch.setattr("app.services.ai.gemini_provider.httpx.AsyncClient", ProviderClient)

    with pytest.raises(AIProviderError) as error:
        await GeminiProvider("test-key", "gemini-3.6-flash").analyze_repository({}, minimal_repository())

    assert error.value.code == "AI_PROVIDER_ERROR"
    assert "gemini HTTP 503" in error.value.message


@pytest.mark.asyncio
async def test_openrouter_invalid_json_and_structured_response(monkeypatch):
    monkeypatch.setattr("app.services.ai.openrouter_provider.httpx.AsyncClient", ProviderClient)
    provider = OpenRouterProvider("test-key", "test-model")
    for content in ("not-json", json.dumps({"provider": "openrouter"})):
        ProviderClient.response = ProviderResponse({"choices": [{"message": {"content": content}}]})
        with pytest.raises(AIProviderError, match="invalid AI response") as error:
            await provider.analyze_repository({}, minimal_repository())
        assert error.value.code == "AI_INVALID_RESPONSE"


@pytest.mark.asyncio
@pytest.mark.parametrize(("status_code", "expected_code"), [(401, "AI_AUTH_ERROR"), (429, "AI_RATE_LIMIT"), (500, "AI_PROVIDER_ERROR")])
async def test_openrouter_http_errors(monkeypatch, status_code, expected_code):
    monkeypatch.setattr("app.services.ai.openrouter_provider.httpx.AsyncClient", ProviderClient)
    ProviderClient.response = ProviderResponse({"error": {"message": "provider failure"}}, status_code)
    with pytest.raises(AIProviderError) as error:
        await OpenRouterProvider("secret-key", "test-model").analyze_repository({}, minimal_repository())
    assert error.value.code == expected_code
    assert "secret-key" not in error.value.message


@pytest.mark.asyncio
async def test_openrouter_timeout(monkeypatch):
    monkeypatch.setattr("app.services.ai.openrouter_provider.httpx.AsyncClient", ProviderClient)
    ProviderClient.response = httpx.ReadTimeout("timed out")
    with pytest.raises(AIProviderError) as error:
        await OpenRouterProvider("test-key", "test-model").analyze_repository({}, minimal_repository())
    assert error.value.code == "AI_TIMEOUT"


@pytest.mark.asyncio
async def test_groq_extracts_tool_call_arguments(monkeypatch):
    ProviderClient.response = ProviderResponse({
        "choices": [{"message": {"tool_calls": [{"function": {"arguments": valid_output("groq").model_dump_json()}}]}}]
    })
    monkeypatch.setattr("app.services.ai.groq_provider.httpx.AsyncClient", ProviderClient)

    result = await GroqProvider("test-key", "openai/gpt-oss-120b").analyze_repository({}, minimal_repository())

    assert result.provider == "groq"


@pytest.mark.asyncio
async def test_groq_normalizes_compact_reasoning_response(monkeypatch):
    compact_output = {
        "repository_summary": "summary",
        "purpose": "purpose",
        "functionalities": [],
        "architecture_summary": "architecture",
        "security_summary": "security",
        "bug_risk_summary": "risk",
        "documentation_summary": "docs",
        "key_findings": [],
        "recommendations": [],
        "installation": "Not available from current repository analysis.",
        "usage": "Not available from current repository analysis.",
        "limitations": "Not available from current repository analysis.",
    }
    ProviderClient.response = ProviderResponse({"choices": [{"message": {"content": json.dumps(compact_output)}}]})
    monkeypatch.setattr("app.services.ai.groq_provider.httpx.AsyncClient", ProviderClient)

    result = await GroqProvider("test-key", "openai/gpt-oss-20b").analyze_repository({}, minimal_repository())

    assert result.status == "completed"
    assert result.provider == "groq"
    assert result.model == "openai/gpt-oss-20b"
    assert result.functionalities == []
    assert result.project_type == "Not available from current repository analysis."


@pytest.mark.asyncio
async def test_groq_request_uses_compact_completion_budget(monkeypatch):
    ProviderClient.calls = []
    ProviderClient.response = ProviderResponse({"choices": [{"message": {"content": valid_output("groq").model_dump_json()}}]})
    monkeypatch.setattr("app.services.ai.groq_provider.httpx.AsyncClient", ProviderClient)

    await GroqProvider("test-key", "openai/gpt-oss-20b").analyze_repository({}, minimal_repository())

    request = ProviderClient.calls[-1][1]["json"]
    assert request["model"] == "openai/gpt-oss-20b"
    assert request["max_completion_tokens"] == 1500
    assert request["response_format"] == {"type": "json_object"}


@pytest.mark.asyncio
async def test_provider_fallback():
    first = FakeProvider(error=AIProviderError("AI_TIMEOUT", "timeout", "gemini", "gemini-test"))
    second = FakeProvider(result=valid_output("groq"))

    result = await ReasoningAgent([first, second]).analyze(minimal_repository())

    assert result.provider == "groq"
    assert first.calls == 1
    assert second.calls == 1


@pytest.mark.asyncio
async def test_default_provider_order_and_fallback_messages(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    agent = ReasoningAgent([
        FakeProvider(error=AIProviderError("AI_PROVIDER_ERROR", "unavailable", "gemini", "gemini-test")),
        FakeProvider(result=valid_output("openrouter")),
    ])
    result = await agent.analyze(minimal_repository())
    assert result.fallback_message == "Gemini unavailable — switched to NVIDIA"


@pytest.mark.asyncio
async def test_openrouter_to_groq_fallback_and_all_unavailable():
    first = FakeProvider(error=AIProviderError("AI_RATE_LIMIT", "rate limited", "openrouter", "test-model"))
    second = FakeProvider(result=valid_output("groq"))
    result = await ReasoningAgent([first, second]).analyze(minimal_repository())
    assert result.fallback_message == "NVIDIA unavailable — switched to Groq"

    with pytest.raises(AIUnavailableError) as error:
        await ReasoningAgent([
            FakeProvider(error=AIProviderError("AI_PROVIDER_ERROR", "gemini failed", "gemini", "gemini-test")),
            FakeProvider(error=AIProviderError("AI_RATE_LIMIT", "nvidia failed", "openrouter", "test-model")),
            FakeProvider(error=AIProviderError("AI_PROVIDER_ERROR", "groq failed", "groq", "groq-test")),
        ]).analyze(minimal_repository())
    assert [attempt.split(":", 1)[0] for attempt in error.value.attempts] == ["gemini", "openrouter", "groq"]


def test_compact_context_has_no_source_or_api_keys(monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-secret")
    context = build_reasoning_context(minimal_repository(), {"agents": [{"name": "agent", "summary": "test-openrouter-secret"}]})
    serialized = json.dumps(context)
    assert "source_files" not in serialized
    assert "test-openrouter-secret" not in serialized
    assert estimate_context_tokens(context) < 7000


def test_ai_response_parser_accepts_wrapped_json_forms():
    payload = valid_output("openrouter").model_dump_json()
    forms = [
        payload,
        f"```json\n{payload}\n```",
        f"Here is the analysis:\n{payload}\nEnd of analysis.",
        f"<think>Planning the answer.</think>\n{payload}",
        json.dumps({"result": json.loads(payload)}),
    ]
    for content in forms:
        assert parse_ai_analysis(content).executive_summary == "executive"

    tool_message = {"tool_calls": [{"function": {"arguments": payload}}]}
    assert parse_ai_analysis(chat_message_content(tool_message)).provider == "openrouter"
    assert parse_ai_analysis([{"type": "text", "text": payload}]).model == "test-model"


def test_parser_prefers_meaningful_nested_result():
    content = json.dumps({
        "output": json.loads(valid_output("groq").model_dump_json()),
    })

    result = parse_ai_analysis(content, {"provider": "groq", "model": "test-model", "status": "completed"})

    assert result.repository_summary == "summary"
    assert result.purpose == "purpose"


def test_parser_preserves_root_content_with_structured_summary_fields():
    content = json.dumps({
        "repository_summary": "VitalSense summary",
        "purpose": "Health monitoring",
        "security_summary": [{"severity": "medium", "file": "report.py"}],
        "bug_risk_summary": {"high_risk_files": ["report.py"]},
    })

    result = parse_ai_analysis(content, {"provider": "groq", "model": "test-model", "status": "completed"})

    assert result.repository_summary == "VitalSense summary"
    assert result.purpose == "Health monitoring"
    assert "medium" in result.security_summary
    assert "report.py" in result.bug_risk_summary


def test_context_budget_has_provider_headroom():
    context = build_reasoning_context(minimal_repository())
    assert estimate_context_tokens(context) <= 5600


@pytest.mark.asyncio
async def test_timeout_and_unavailable_state():
    first = FakeProvider(error=AIProviderError("AI_TIMEOUT", "timeout", "gemini", "gemini-test"))
    second = FakeProvider(error=AIProviderError("AI_PROVIDER_ERROR", "failure", "groq", "groq-test"))

    with pytest.raises(AIUnavailableError) as error:
        await ReasoningAgent([first, second]).analyze(minimal_repository())

    assert error.value.attempts == ["gemini:AI_TIMEOUT:timeout", "groq:AI_PROVIDER_ERROR:failure"]


def test_valid_structured_output_and_invalid_response_model():
    result = valid_output()

    assert result.status == "completed"
    with pytest.raises(ValueError):
        AIAnalysisOutput.model_validate_json("{not-json}")
