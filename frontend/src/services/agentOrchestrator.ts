import type {
  ArchitectureAnalysis,
  BugRiskSummary,
  RepositoryAnalysis,
} from "@/services/analysisApi"

export type AgentExecutionStatus = "READY" | "RUNNING" | "COMPLETED" | "NO_DATA" | "FAILED"

export interface AgentResult {
  id: string
  name: string
  status: AgentExecutionStatus
  inputSource: string
  output: string
  evidenceCount: number
  summary: string
  evidence: string[]
}

export interface NormalizedAnalysisSummary {
  repository: { owner: string; name: string; default_branch: string; source_files: number }
  overview: { structure_items: number; primary_language: string | null }
  architecture: ArchitectureAnalysis
  knowledge_graph: RepositoryAnalysis["entity_graph"]
  security: RepositoryAnalysis["security_analysis"]
  bug_risk: BugRiskSummary
  metrics: RepositoryAnalysis["metrics"]
  documentation: RepositoryAnalysis["documentation_analysis"]
  dependencies: RepositoryAnalysis["dependency_graph"]
  ai_insights: null
}

export interface AgentOrchestration {
  repository: string
  agents: AgentResult[]
  summary: NormalizedAnalysisSummary
}

function completedAgent(
  id: string,
  name: string,
  inputSource: string,
  output: string,
  evidence: string[],
  summary: string,
): AgentResult {
  return { id, name, status: "COMPLETED", inputSource, output, evidenceCount: evidence.length, summary, evidence }
}

function unavailableAgent(id: string, name: string, inputSource: string): AgentResult {
  return { id, name, status: "NO_DATA", inputSource, output: "No required analysis data is available.", evidenceCount: 0, summary: "Waiting for the required deterministic analysis output.", evidence: [] }
}

export function buildAnalysisSummary(repository: RepositoryAnalysis): NormalizedAnalysisSummary {
  return {
    repository: { owner: repository.owner, name: repository.name, default_branch: repository.default_branch, source_files: repository.source_files.length },
    overview: { structure_items: repository.structure.length, primary_language: Object.entries(repository.languages).sort(([, left], [, right]) => right - left)[0]?.[0] ?? null },
    architecture: repository.architecture_analysis,
    knowledge_graph: repository.entity_graph,
    security: repository.security_analysis,
    bug_risk: repository.bug_risk_analysis,
    metrics: repository.metrics,
    documentation: repository.documentation_analysis,
    dependencies: repository.dependency_graph,
    ai_insights: null,
  }
}

export function orchestrateAgents(repository: RepositoryAnalysis): AgentOrchestration {
  const security = repository.security_analysis
  const bugRisk = repository.bug_risk_analysis
  const architecture = repository.architecture_analysis
  const graph = repository.entity_graph
  const metrics = repository.metrics
  const docs = repository.documentation_analysis
  const agents: AgentResult[] = [
    completedAgent("repository", "Repository Agent", "metadata + structure + source_files + ast_analysis", `${repository.source_files.length} source files`, [
      `${repository.structure.length} repository items`, `${repository.source_files.length} source files`, `${repository.ast_analysis.length} AST analyses`,
    ], `Indexed ${repository.source_files.length} source files from ${repository.owner}/${repository.name}.`),
    architecture?.components ? completedAgent("architecture", "Architecture Agent", "architecture_analysis", `${architecture.components.length} components`, [
      `${architecture.components.length} components`, `${architecture.relationships?.length ?? 0} relationships`, `${architecture.evidence?.length ?? 0} evidence signals`,
    ], architecture.description) : unavailableAgent("architecture", "Architecture Agent", "architecture_analysis"),
    completedAgent("dependencies", "Dependency Agent", "dependency_graph", `${repository.dependency_graph.edges?.length ?? 0} dependency edges`, [
      `${repository.dependency_graph.nodes?.length ?? 0} graph nodes`, `${repository.dependency_graph.edges?.length ?? 0} graph edges`,
    ], `Mapped ${repository.dependency_graph.edges?.length ?? 0} dependency relationships.`),
    security?.status === "completed" || security?.status === "no_eligible_files"
      ? completedAgent("security", "Security Agent", "security_analysis", `${security.total_findings} findings`, [
        `${security.files_scanned} eligible files scanned`, `${security.total_findings} findings`, `${security.rules_applied.length} rules applied`,
      ], security.total_findings ? `Configured static rules identified ${security.total_findings} findings.` : "No issues detected by the configured static rules.")
      : unavailableAgent("security", "Security Agent", "security_analysis"),
    bugRisk?.status === "completed" || bugRisk?.status === "no_eligible_files"
      ? completedAgent("bug-risk", "Bug Risk Agent", "bug_risk_analysis", `${bugRisk.files_analyzed} files analyzed`, [
        `${bugRisk.files_analyzed} files analyzed`, `${bugRisk.high_risk_count + bugRisk.critical_count} high/critical files`, `${bugRisk.findings.length} risk findings`,
      ], `Static heuristic prediction across ${bugRisk.files_analyzed} analyzed files.`)
      : unavailableAgent("bug-risk", "Bug Risk Agent", "bug_risk_analysis"),
    metrics ? completedAgent("metrics", "Metrics Agent", "metrics", `${metrics.source_files} source files measured`, [
      `${metrics.total_functions} functions`, `${metrics.total_classes} classes`, `${metrics.total_imports} imports`,
    ], `Measured repository structure, symbols, dependencies, and language distribution.`) : unavailableAgent("metrics", "Metrics Agent", "metrics"),
    docs ? completedAgent("documentation", "Documentation Agent", "documentation_analysis", `${docs.documentation_files} documentation files`, [
      `${docs.documentation_files} documentation files`, `${docs.todo_count} TODO markers`, `${docs.fixme_count} FIXME markers`,
    ], `Documentation coverage and unresolved markers were measured from repository evidence.`) : unavailableAgent("documentation", "Documentation Agent", "documentation_analysis"),
    graph ? completedAgent("knowledge-graph", "Knowledge Graph Agent", "entity_graph", `${graph.nodes?.length ?? 0} entities`, [
      `${graph.nodes?.length ?? 0} entities`, `${graph.edges?.length ?? 0} relationships`,
    ], `Built from the repository's returned entity nodes and relationships.`) : unavailableAgent("knowledge-graph", "Knowledge Graph Agent", "entity_graph"),
    unavailableAgent("reasoning", "AI Reasoning Agent", "normalized deterministic analysis summary"),
  ]
  return { repository: `${repository.owner}/${repository.name}`, agents, summary: buildAnalysisSummary(repository) }
}