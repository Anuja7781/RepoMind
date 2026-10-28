import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import type { RepositoryAnalysis } from "@/services/analysisApi"
import { runAIReasoning, type AIAnalysisOutput } from "@/services/aiApi"
import { orchestrateAgents } from "@/services/agentOrchestrator"
import { downloadAnalysisReport } from "@/services/reportApi"

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null
  return <div><div className="section-label mb-2">{title}</div><ul className="space-y-1 text-sm text-gray-300">{items.map(item => <li key={item} className="border-l border-cyan-400/30 pl-3">{item}</li>)}</ul></div>
}

export default function AIInsights({ repository }: { repository: RepositoryAnalysis }) {
  const [result, setResult] = useState<AIAnalysisOutput | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportState, setReportState] = useState<"idle" | "loading" | "downloaded">("idle")

  const run = async () => {
    setRunning(true)
    setError(null)
    setResult(null)
    setReportState("idle")
    try {
      setResult(await runAIReasoning(repository, orchestrateAgents(repository)))
    } catch (reasoningError) {
      setError(reasoningError instanceof Error ? reasoningError.message : "AI reasoning failed.")
    } finally {
      setRunning(false)
    }
  }

  const unavailable = result?.status === "unavailable" || result?.status === "error"
  const providerLabel = result?.provider === "groq" ? "Groq · GPT-OSS 20B" : result?.provider
  const executiveSummary = result?.repository_summary || repository.description || "Not available from current repository analysis."
  const generateReport = async () => {
    if (result?.status !== "completed") return
    setReportState("loading")
    try {
      await downloadAnalysisReport(repository, result, orchestrateAgents(repository).agents)
      setReportState("downloaded")
    } catch (reportError) {
      setReportState("idle")
      setError(reportError instanceof Error ? reportError.message : "Report generation failed.")
    }
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="section-label">AI Reasoning Layer</div><p className="mt-2 text-xs text-gray-500">Evidence-bound interpretation of the current deterministic repository analysis.</p></div>
      <button onClick={run} disabled={running} className="btn-primary rounded-lg px-4 py-2 text-xs text-white disabled:opacity-50">{running ? "Analyzing repository..." : "Run AI Analysis"}</button>
    </div>
    {running && <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4 text-sm text-cyan-200">Analyzing repository with Groq...</div>}
    {error && <div className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4 text-sm text-red-200">{error}</div>}
    {!result && !running && !error && <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 text-sm text-gray-500">Run AI Analysis to interpret {repository.owner}/{repository.name}. The deterministic analysis remains available in every other tab.</div>}
    {result && <>
      <div className="flex flex-wrap gap-2 text-xs font-mono"><span className="rounded border border-cyan-400/20 px-2 py-1 text-cyan-300">{providerLabel}</span><span className="rounded border border-white/10 px-2 py-1 text-gray-400">{result.model}</span><span className="rounded border border-white/10 px-2 py-1 text-gray-400">{result.status.toUpperCase()}</span></div>
      {result.fallback_message && <div className="text-xs text-yellow-300">{result.fallback_message}</div>}
      {unavailable ? <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] p-4 text-sm text-yellow-100">AI reasoning is unavailable. {result.error_message ?? ""}</div> : <>
        <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-5"><div className="section-label mb-2">Executive Summary</div><p className="text-sm leading-relaxed text-gray-200">{executiveSummary}</p></div>
        <div><div className="section-label mb-2">Repository Summary</div><p className="text-sm leading-relaxed text-gray-300">{result.repository_summary}</p></div>
        <div className="grid gap-5 md:grid-cols-2"><div className="space-y-4"><div><div className="section-label mb-2">Repository Purpose</div><p className="text-sm text-gray-300">{result.purpose}</p></div><div><div className="section-label mb-2">Architecture</div><p className="text-sm text-gray-300">{result.architecture_summary}</p><p className="mt-1 text-xs text-gray-500">Pattern: {result.architecture_pattern}</p></div><div><div className="section-label mb-2">Security Interpretation</div><p className="text-sm text-gray-300">{result.security_summary}</p></div></div><div className="space-y-4"><div><div className="section-label mb-2">Bug Risk Interpretation</div><p className="text-sm text-gray-300">{result.bug_risk_summary}</p></div><div><div className="section-label mb-2">Code Quality</div><p className="text-sm text-gray-300">{result.code_quality_summary}</p></div><div><div className="section-label mb-2">Documentation</div><p className="text-sm text-gray-300">{result.documentation_summary}</p></div></div></div>
        <div className="grid gap-5 md:grid-cols-2"><ListSection title="Functionalities" items={result.functionalities} /><ListSection title="Technology Stack" items={result.technology_stack} /><ListSection title="Entry Points" items={result.entry_points} /><ListSection title="Security Priorities" items={result.security_priorities} /><ListSection title="High-Risk Areas" items={result.high_risk_areas} /><ListSection title="Key Findings" items={result.key_findings} /><ListSection title="Recommendations" items={result.recommendations} /><ListSection title="Installation" items={result.installation} /><ListSection title="Usage" items={result.usage} /><ListSection title="Important Files" items={result.important_files} /><ListSection title="Limitations" items={result.limitations} /></div>
        {result.status === "completed" && <div className="flex justify-end border-t border-white/[0.08] pt-5"><button onClick={generateReport} disabled={reportState === "loading"} className="btn-primary rounded-lg px-4 py-2 text-xs text-white flex items-center gap-2 disabled:opacity-60"><span>{reportState === "loading" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}</span>{reportState === "loading" ? "Generating Report..." : reportState === "downloaded" ? "Report Downloaded" : "Generate & Download Report"}</button></div>}
      </>}
    </>}
  </div>
}
