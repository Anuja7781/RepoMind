from io import BytesIO

from fastapi import APIRouter, HTTPException, Response, status
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.schemas import AnalyzeRequest, RepositoryAnalysis
from app.services.ai.reasoning_agent import ReasoningAgent
from app.services.ai.schemas import AIAnalysisOutput, AIReasonRequest, AIUnavailableError
from app.services.config import ConfigurationError
from app.services.github_service import GitHubAPIError, GitHubService, RepositoryNotFoundError


router = APIRouter()


NOT_AVAILABLE = "Not available from current repository analysis."


def _value(value, fallback=NOT_AVAILABLE):
    return fallback if value is None or value == "" else value


def _paragraph(value, style):
    return Paragraph(str(_value(value)).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), style)


def _bullets(items, style):
    values = items if isinstance(items, list) and items else [items] if items else []
    return [_paragraph(f"• {item}", style) for item in values] or [_paragraph(NOT_AVAILABLE, style)]


def build_pdf_report(analysis: RepositoryAnalysis, ai_result: dict | None = None) -> bytes:
    ai = ai_result or {}
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm, topMargin=16 * mm, bottomMargin=15 * mm, title="RepoMind AI Analysis Report")
    styles = getSampleStyleSheet()
    title = ParagraphStyle("ReportTitle", parent=styles["Title"], alignment=TA_CENTER, textColor=colors.HexColor("#312e81"), spaceAfter=8)
    subtitle = ParagraphStyle("ReportSubtitle", parent=styles["Normal"], alignment=TA_CENTER, textColor=colors.HexColor("#475569"), spaceAfter=18)
    heading = ParagraphStyle("ReportHeading", parent=styles["Heading2"], textColor=colors.HexColor("#1e1b4b"), spaceBefore=12, spaceAfter=7)
    body = ParagraphStyle("ReportBody", parent=styles["BodyText"], fontSize=9, leading=12, spaceAfter=5)
    small = ParagraphStyle("ReportSmall", parent=body, fontSize=8, leading=10)
    story = [Paragraph("RepoMind AI", title), Paragraph("Intelligent Repository Analysis Report", subtitle)]

    def section(name):
        story.append(Paragraph(name, heading))

    def table(rows, widths=None):
        prepared = [[_paragraph(cell, small) for cell in row] for row in rows]
        item = Table(prepared, colWidths=widths, repeatRows=1)
        item.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e0e7ff")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1e1b4b")),
            ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(item)

    executive = ai.get("repository_summary") or analysis.description or NOT_AVAILABLE
    section("Executive Summary")
    story.append(_paragraph(executive, body))
    section("Repository Information")
    table([["Field", "Value"], ["Repository", f"{analysis.owner}/{analysis.name}"], ["Description", _value(analysis.description)], ["Default branch", analysis.default_branch], ["Stars / forks", f"{analysis.stars} / {analysis.forks}"], ["Repository size", analysis.repository_size], ["Languages", ", ".join(f"{key}: {value}" for key, value in analysis.languages.items()) or NOT_AVAILABLE]], [42 * mm, 132 * mm])
    section("Repository Purpose & Functionalities")
    story.append(_paragraph(ai.get("purpose") or NOT_AVAILABLE, body))
    story.extend(_bullets(ai.get("functionalities"), body))
    section("Repository Structure")
    story.append(_paragraph(f"{len(analysis.structure)} repository items, {len(analysis.source_files)} source files, and {len(analysis.ast_analysis)} AST analyses were processed.", body))
    section("Architecture Analysis")
    story.append(_paragraph(f"Pattern: {_value(analysis.architecture_analysis.architecture_pattern)}. AI interpretation: {_value(ai.get('architecture_summary'))}", body))
    table([["Component", "Type", "Files", "Confidence"]] + [[component.name, component.component_type, component.source_file_count, component.confidence] for component in analysis.architecture_analysis.components], [42 * mm, 38 * mm, 25 * mm, 35 * mm])
    story.extend(_bullets([f"{item.source_component} {item.relationship_type} {item.target_component} ({item.confidence})" for item in analysis.architecture_analysis.relationships], small))
    section("Knowledge Graph")
    relationships = {}
    for edge in analysis.entity_graph.edges:
        relationships[edge.relationship] = relationships.get(edge.relationship, 0) + 1
    story.append(_paragraph(f"{len(analysis.entity_graph.nodes)} entities and {len(analysis.entity_graph.edges)} relationships. Relationship types: {relationships or NOT_AVAILABLE}.", body))
    section("Security Analysis")
    security = analysis.security_analysis
    story.append(_paragraph(f"{security.files_scanned} files scanned; {security.total_findings} findings. AI interpretation: {_value(ai.get('security_summary'))}", body))
    table([["Severity", "Rule", "File", "Line", "Recommendation"]] + [[finding.severity, finding.rule, finding.file, finding.line or "", finding.recommendation] for finding in security.findings], [20 * mm, 30 * mm, 35 * mm, 12 * mm, 70 * mm])
    section("Bug Risk Analysis")
    bug = analysis.bug_risk_analysis
    story.append(_paragraph(f"{bug.files_analyzed} files analyzed. Distribution: critical {bug.critical_count}, high {bug.high_risk_count}, medium {bug.medium_risk_count}, low {bug.low_risk_count}. AI interpretation: {_value(ai.get('bug_risk_summary'))}", body))
    story.extend(_bullets([f"{finding.path}: {finding.level}, score {finding.score}; factors: {', '.join(finding.factors)}" for finding in sorted(bug.findings, key=lambda item: -item.score)[:10]], small))
    story.append(_paragraph("Bug-risk results are static-analysis indicators and do not prove that a defect exists.", small))
    section("Metrics")
    metrics = analysis.metrics
    if metrics:
        table([["Metric", "Value"], ["Source files", metrics.source_files], ["AST files", metrics.ast_analyzed_files], ["Functions / classes / methods", f"{metrics.total_functions} / {metrics.total_classes} / {metrics.total_methods}"], ["Imports / dependencies", f"{metrics.total_imports} / {metrics.dependency_edges}"], ["Graph entities / relationships", f"{metrics.entity_nodes} / {metrics.entity_relationships}"], ["Architecture components / relationships", f"{metrics.architecture_components} / {metrics.architecture_relationships}"], ["Language distribution", metrics.language_file_counts]], [65 * mm, 109 * mm])
    section("Documentation")
    docs = analysis.documentation_analysis
    story.append(_paragraph(str(docs.model_dump() if docs else NOT_AVAILABLE), small))
    section("Agents")
    agent_rows = []
    for agent in ((ai_result or {}).get("agents", []) if ai_result else []):
        if agent.get("name") == "AI Reasoning Agent":
            completed = ai.get("status") == "completed"
            agent = {
                **agent,
                "status": "COMPLETED" if completed else "NO_DATA",
                "summary": "Generated evidence-bound repository insights using the configured AI reasoning provider." if completed else agent.get("summary"),
            }
        agent_rows.append(f"{agent.get('name')}: {agent.get('status')} — {agent.get('summary') or agent.get('output')}")
    story.extend(_bullets(agent_rows, small))
    section("AI Insights")
    for label, key in [("Repository Summary", "repository_summary"), ("Purpose", "purpose"), ("Functionalities", "functionalities"), ("Architecture Summary", "architecture_summary"), ("Security Summary", "security_summary"), ("Bug Risk Summary", "bug_risk_summary"), ("Documentation Summary", "documentation_summary"), ("Key Findings", "key_findings"), ("Recommendations", "recommendations"), ("Installation", "installation"), ("Usage", "usage"), ("Limitations", "limitations")]:
        story.append(Paragraph(label, styles["Heading3"]))
        story.extend(_bullets(ai.get(key), body) if isinstance(ai.get(key), list) else [_paragraph(ai.get(key), body)])
    section("Methodology & Limitations")
    story.append(_paragraph("RepoMind uses repository metadata, source structure, AST, dependency, architecture, knowledge graph, security, bug-risk, documentation, metrics, and AI reasoning over structured deterministic analysis.", body))
    story.append(_paragraph("AI reasoning was not available at report time." if not ai_result or ai.get("status") != "completed" else "; ".join(ai.get("limitations") or [NOT_AVAILABLE]), body))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#64748b"))
        canvas.drawString(16 * mm, 8 * mm, "RepoMind AI")
        canvas.drawRightString(A4[0] - 16 * mm, 8 * mm, f"Page {doc.page}")
        canvas.restoreState()

    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()


@router.post("/analyze", response_model=RepositoryAnalysis)
async def analyze_repository(request: AnalyzeRequest) -> RepositoryAnalysis:
    try:
        return await GitHubService().analyze_repository(request.repository_url)
    except RepositoryNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub repository not found",
        ) from error
    except GitHubAPIError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to retrieve repository information from GitHub",
        ) from error
    except ConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub token is not configured",
        ) from error


@router.post("/ai/reason", response_model=AIAnalysisOutput)
async def reason_about_repository(request: AIReasonRequest) -> AIAnalysisOutput:
    try:
        repository = RepositoryAnalysis.model_validate(request.analysis)
    except ValueError as error:
        return AIAnalysisOutput(
            provider="none", model="none", status="error",
            repository_summary="", purpose="", project_type="",
            architecture_summary="", architecture_pattern="",
            security_summary="", bug_risk_summary="",
            code_quality_summary="", documentation_summary="",
            executive_summary="", error_code="AI_INVALID_RESPONSE",
            error_message="The supplied repository analysis does not match the backend contract.",
        )
    try:
        return await ReasoningAgent().analyze(repository, request.agent_summary)
    except AIUnavailableError as error:
        return AIAnalysisOutput(
            provider="none", model="none", status="unavailable",
            repository_summary="", purpose="", project_type="",
            architecture_summary="", architecture_pattern="",
            security_summary="", bug_risk_summary="",
            code_quality_summary="", documentation_summary="",
            executive_summary="AI reasoning is unavailable. Configure an AI provider key in backend/.env.",
            error_code="AI_UNAVAILABLE",
            error_message=f"Provider attempts: {', '.join(error.attempts)}",
        )


@router.post("/report/pdf")
async def generate_report(request: dict) -> Response:
    try:
        analysis = RepositoryAnalysis.model_validate(request.get("analysis", {}))
        pdf = build_pdf_report(analysis, request.get("ai_result"))
    except (TypeError, ValueError, KeyError) as error:
        raise HTTPException(status_code=422, detail="The supplied report data is invalid.") from error
    filename = f"RepoMind_{analysis.owner}_{analysis.name}_Analysis_Report.pdf"
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="{filename}"'})