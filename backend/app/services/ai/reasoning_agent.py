import os
import json
import logging
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv

from app.schemas import RepositoryAnalysis
from app.services.ai.groq_provider import GroqProvider
from app.services.ai.provider import AIProvider
from app.services.ai.schemas import AIAnalysisOutput, AIProviderError, AIUnavailableError


MAX_CONTEXT_TOKENS = 5000
logger = logging.getLogger(__name__)


def _text(value: object, limit: int = 240) -> str | None:
    if value is None:
        return None
    return str(value)[:limit]


def _model_data(value: object) -> dict:
    return value.model_dump(mode="json", exclude_none=True) if hasattr(value, "model_dump") else value


def _compact_security_finding(finding) -> dict:
    return {
        "id": finding.id,
        "rule": finding.rule,
        "severity": finding.severity,
        "category": finding.category,
        "title": _text(finding.title, 180),
        "file": finding.file,
        "line": finding.line,
        "evidence": _text(finding.evidence, 220),
        "recommendation": _text(finding.recommendation, 220),
        "confidence": finding.confidence,
    }


def _compact_architecture(repository: RepositoryAnalysis) -> dict:
    architecture = repository.architecture_analysis
    return {
        "pattern": architecture.architecture_pattern,
        "entry_point": architecture.entry_point,
        "primary_language": architecture.primary_language,
        "confidence": architecture.confidence,
        "components": [
            {
                "id": component.id,
                "name": component.name,
                "component_type": component.component_type,
                "files": sorted(component.files)[:12],
                "source_file_count": component.source_file_count,
                "representative_path": component.representative_path,
                "confidence": component.confidence,
            }
            for component in architecture.components
        ],
        "relationships": [
            {
                "source_component": relationship.source_component,
                "target_component": relationship.target_component,
                "relationship_type": relationship.relationship_type,
                "evidence_count": relationship.evidence_count,
                "evidence": [
                    {"source_file": evidence.source_file, "target_module": evidence.target_module}
                    for evidence in relationship.evidence
                ],
                "confidence": relationship.confidence,
                "supporting_files": sorted(relationship.supporting_files),
            }
            for relationship in architecture.relationships
        ],
    }


def _compact_agents(agent_summary: dict | None) -> list[dict]:
    agents = (agent_summary or {}).get("agents", []) if isinstance(agent_summary, dict) else []
    return [
        {
            "name": _text(agent.get("name"), 100),
            "status": _text(agent.get("status"), 40),
            "summary": _text(agent.get("summary"), 220),
            "output": _text(agent.get("output"), 160),
            "evidence": [_text(item, 140) for item in agent.get("evidence", [])[:4]],
        }
        for agent in agents
        if isinstance(agent, dict)
    ]


def estimate_context_tokens(context: dict) -> int:
    """Estimate provider input tokens conservatively from compact JSON."""
    return (len(json.dumps(context, sort_keys=True, separators=(",", ":"), ensure_ascii=True)) + 2) // 3


def _remove_low_priority_items(context: dict) -> None:
    reductions = [
        ("knowledge_graph", "relationships"),
        ("knowledge_graph", "important_entities"),
        ("dependencies", "edges"),
        ("structure", "important_files"),
        ("agents", None),
    ]
    while estimate_context_tokens(context) > MAX_CONTEXT_TOKENS:
        changed = False
        for section, key in reductions:
            items = context[section] if key is None else context[section][key]
            if items:
                items.pop()
                changed = True
                break
        if not changed:
            break


def _sanitize(value: object) -> object:
    if isinstance(value, dict):
        return {key: _sanitize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_sanitize(item) for item in value]
    if isinstance(value, str):
        for name in ("GEMINI_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"):
            secret = os.getenv(name)
            if secret and len(secret) >= 8:
                value = value.replace(secret, "[REDACTED]")
        return value
    return value


def build_reasoning_context(repository: RepositoryAnalysis, agent_summary: dict | None = None) -> dict:
    architecture = repository.architecture_analysis
    security = repository.security_analysis
    bug_risk = repository.bug_risk_analysis
    metrics = repository.metrics
    documentation = repository.documentation_analysis
    risk_findings = sorted(bug_risk.findings, key=lambda finding: (-finding.score, finding.path))[:10]
    security_findings = sorted(
        security.findings,
        key=lambda finding: ({"critical": 0, "high": 1, "medium": 2, "low": 3}.get(finding.severity.lower(), 4), finding.file, finding.line or 0),
    )[:10]
    relationships = [
        {
            "source": relationship.source_component,
            "target": relationship.target_component,
            "type": relationship.relationship_type,
            "confidence": relationship.confidence,
        }
        for relationship in architecture.relationships
    ]
    agent_items = (agent_summary or {}).get("agents", []) if isinstance(agent_summary, dict) else []
    agent_summaries = [
        {"name": _text(agent.get("name"), 80), "status": _text(agent.get("status"), 30), "summary": _text(agent.get("summary"), 180)}
        for agent in agent_items
        if isinstance(agent, dict)
    ]
    documentation_context = None
    if documentation:
        documentation_context = {
            "readme_available": documentation.readme.exists,
            "docstring_coverage": {
                "functions": documentation.functions.coverage,
                "classes": documentation.classes.coverage,
                "methods": documentation.methods.coverage,
            },
            "todo_count": documentation.todo_count,
            "fixme_count": documentation.fixme_count,
            "comment_count": documentation.source_comment_lines,
            "documentation_coverage": documentation.ast_coverage_percent,
        }
    metric_context = None
    if metrics:
        metric_context = {
            "source_files": metrics.source_files,
            "functions": metrics.total_functions,
            "classes": metrics.total_classes,
            "methods": metrics.total_methods,
            "imports": metrics.total_imports,
            "dependencies": metrics.dependency_edges,
            "architecture_components": metrics.architecture_components,
            "architecture_relationships": metrics.architecture_relationships,
            "graph_entities": metrics.entity_nodes,
            "graph_relationships": metrics.entity_relationships,
        }
    context = {
        "repository": {"name": repository.name, "owner": repository.owner, "description": _text(repository.description, 300), "languages": dict(sorted(repository.languages.items())), "source_file_count": len(repository.source_files), "metadata": {"default_branch": repository.default_branch, "stars": repository.stars, "forks": repository.forks, "repository_size": repository.repository_size}},
        "structure": {"directory_count": sum(item.type == "tree" for item in repository.structure), "important_files": sorted(item.path for item in repository.structure if item.path.lower().startswith(("readme", "license", "main", "app", "src/")))[:20]},
        "architecture": {"components": [{"name": component.name, "type": component.component_type, "description": f"{component.source_file_count} source file(s); representative path: {component.representative_path or 'not available'}", "confidence": component.confidence} for component in architecture.components], "relationships": relationships[:30], "confidence": architecture.confidence},
        "security": {"severity": {"critical": security.critical_count, "high": security.high_count, "medium": security.medium_count, "low": security.low_count}, "findings": [{"severity": finding.severity, "rule": finding.rule, "file": finding.file, "line": finding.line, "recommendation": _text(finding.recommendation, 180)} for finding in security_findings]},
        "bug_risk": {"highest_risk_files": [{"file": finding.path, "level": finding.level, "score": finding.score, "factors": finding.factors[:5]} for finding in risk_findings]},
        "metrics": metric_context,
        "documentation": documentation_context,
        "knowledge_graph": {"entity_count": len(repository.entity_graph.nodes), "relationship_count": len(repository.entity_graph.edges), "top_relationship_types": Counter(edge.relationship for edge in repository.entity_graph.edges).most_common(8)},
        "agents": agent_summaries,
    }
    context = _sanitize(context)
    return context


class ReasoningAgent:
    def __init__(self, providers: list[AIProvider] | None = None):
        load_dotenv(Path(__file__).resolve().parents[3] / ".env")
        self.providers = providers or [
            GroqProvider(os.getenv("GROQ_API_KEY"), os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")),
        ]

    async def analyze(self, repository: RepositoryAnalysis, agent_summary: dict | None = None) -> AIAnalysisOutput:
        context = build_reasoning_context(repository, agent_summary)
        documentation = repository.documentation_analysis
        logger.warning(
            "AI context repository=%s owner=%s description=%s source_files=%s architecture_components=%s architecture_relationships=%s security_findings=%s bug_risk_files=%s documentation_metrics=%s graph_entities=%s graph_relationships=%s serialized_context_length=%s",
            repository.name,
            repository.owner,
            bool(repository.description),
            len(repository.source_files),
            len(repository.architecture_analysis.components),
            len(repository.architecture_analysis.relationships),
            len(repository.security_analysis.findings),
            repository.bug_risk_analysis.files_analyzed,
            {"readme": documentation.readme.exists, "todo": documentation.todo_count, "fixme": documentation.fixme_count, "comments": documentation.source_comment_lines} if documentation else None,
            len(repository.entity_graph.nodes),
            len(repository.entity_graph.edges),
            len(json.dumps(context, separators=(",", ":"))),
        )
        attempts: list[str] = []
        for provider in self.providers:
            try:
                result = await provider.analyze_repository(context, repository)
                if attempts:
                    previous_provider = attempts[-1].split(":", 1)[0]
                    labels = {"gemini": "Gemini", "openrouter": "NVIDIA", "groq": "Groq"}
                    result = result.model_copy(update={"fallback_message": f"{labels.get(previous_provider, previous_provider)} unavailable — switched to {labels.get(result.provider, result.provider)}"})
                return result
            except AIProviderError as error:
                attempts.append(f"{error.provider}:{error.code}:{error.message}")
        raise AIUnavailableError(attempts)
