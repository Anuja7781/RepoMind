import type { RepositoryAnalysis } from "./analysisApi"
import type { AgentOrchestration } from "./agentOrchestrator"

export interface AIAnalysisOutput {
  provider: string
  model: string
  status: "completed" | "unavailable" | "error"
  repository_summary: string
  purpose: string
  project_type: string
  functionalities: string[]
  technology_stack: string[]
  architecture_summary: string
  architecture_pattern: string
  entry_points: string[]
  security_summary: string
  security_priorities: string[]
  bug_risk_summary: string
  high_risk_areas: string[]
  code_quality_summary: string
  documentation_summary: string
  key_findings: string[]
  recommendations: string[]
  installation: string[]
  usage: string[]
  important_files: string[]
  limitations: string[]
  executive_summary: string
  fallback_message?: string | null
  error_code?: string | null
  error_message?: string | null
}

export async function runAIReasoning(analysis: RepositoryAnalysis, orchestration?: AgentOrchestration): Promise<AIAnalysisOutput> {
  const response = await fetch("/api/ai/reason", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis, agent_summary: orchestration ? { agents: orchestration.agents } : {} }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload) throw new Error("AI reasoning request failed.")
  return payload as AIAnalysisOutput
}
