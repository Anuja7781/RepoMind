import type { RepositoryAnalysis } from "./analysisApi"
import type { AIAnalysisOutput } from "./aiApi"

export async function downloadAnalysisReport(repository: RepositoryAnalysis, aiResult: AIAnalysisOutput | null, agents: unknown[]): Promise<void> {
  const response = await fetch("/api/report/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysis: repository, ai_result: aiResult ? { ...aiResult, agents } : { status: "unavailable", agents } }),
  })
  if (!response.ok) throw new Error("Report generation failed.")
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `RepoMind_${repository.owner}_${repository.name}_Analysis_Report.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}