import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GitBranch as GitBranchIcon, Loader2, CheckCircle2, ChevronRight, AlertTriangle, GitBranch, Star, GitFork } from "lucide-react"
import { PRESET_REPOS, ANALYSIS_PHASES } from "@/data/mockRepo"
import { useAnalysis } from "@/hooks/useAnalysis"
import type { BugRiskSummary, RepositoryAnalysis } from "@/services/analysisApi"
import { orchestrateAgents, type AgentResult } from "@/services/agentOrchestrator"
import ArchitectureGraph from "./ArchitectureGraph"
import KnowledgeGraph from "./KnowledgeGraph"
import RepositoryTree from "./RepositoryTree"
import SecurityPanel from "./SecurityPanel"
import MetricsPanel from "./MetricsPanel"
import DocumentationPanel from "./DocumentationPanel"
import AIInsights from "./AIInsights"

// ─── Analysis Input ──────────────────────────────────────────────────────────
function AnalysisInput({ repoUrl, setRepoUrl, onStart }: { repoUrl: string; setRepoUrl: (u: string) => void; onStart: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative">
        {/* Input container */}
        <div className="flex flex-col sm:flex-row gap-0 bg-[#0e0e1a] rounded-2xl border border-violet-500/25 overflow-hidden shadow-xl shadow-violet-900/20 focus-within:border-violet-500/60 transition-colors duration-200">
          {/* URL input */}
          <div className="flex items-center gap-3 flex-1 px-5 py-4">
            <GitBranch size={18} className="text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onStart()}
              placeholder="https://github.com/owner/repository"
              className="flex-1 bg-transparent text-base text-gray-200 placeholder-gray-600 outline-none font-mono"
            />
          </div>
          {/* Analyze button */}
          <button
            onClick={() => onStart()}
            className="btn-primary text-white font-semibold px-8 py-4 flex items-center justify-center gap-2 text-sm shrink-0 rounded-none sm:rounded-r-2xl"
          >
            <span>Analyze Repository</span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Preset repo pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-xs text-gray-600 font-mono">Try:</span>
          {PRESET_REPOS.map(r => (
            <button key={r} onClick={() => { setRepoUrl(`https://github.com/${r}`); inputRef.current?.focus() }}
              className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-violet-300 hover:border-violet-500/30 transition-all">
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Analysis Progress ───────────────────────────────────────────────────────
function AnalysisProgress({ currentPhase, phaseProgress, repoUrl }: {
  currentPhase: number; phaseProgress: number; repoUrl: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      {/* Repo card */}
      <div className="glass rounded-2xl p-5 mb-6 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <GitBranch size={18} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white truncate">{repoUrl}</div>
          <div className="text-xs text-gray-500 truncate">Waiting for the backend analysis response</div>
        </div>
      </div>

      {/* Phase progress */}
      <div className="space-y-3">
        {ANALYSIS_PHASES.map((phase, i) => {
          const done = i < currentPhase
          const active = i === currentPhase
          const pending = i > currentPhase

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: pending ? 0.4 : 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl px-4 py-3 flex items-center gap-4 transition-all"
              style={{ backgroundColor: active ? "rgba(124,58,237,0.08)" : "rgba(14,14,26,0.7)", border: `1px solid ${active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)"}` }}
            >
              {/* Status icon */}
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                {done
                  ? <CheckCircle2 size={16} className="text-green-400" />
                  : active
                    ? <Loader2 size={16} className="text-violet-400 animate-spin" />
                    : <div className="w-3 h-3 rounded-full bg-gray-700" />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${done ? "text-gray-400" : active ? "text-white" : "text-gray-600"}`}>
                  {phase.label}
                </div>
                {active && <div className="text-xs text-gray-500 mt-0.5">{phase.description}</div>}
              </div>

              {/* Progress bar or done */}
              <div className="shrink-0 w-32">
                {active ? (
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-violet-400">running</span>
                      <span className="text-gray-500">{Math.round(phaseProgress)}%</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full">
                      <motion.div
                        className="h-full rounded-full bg-violet-500"
                        animate={{ width: `${phaseProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                  </div>
                ) : done ? (
                  <span className="font-mono text-xs text-green-400">complete</span>
                ) : (
                  <span className="font-mono text-xs text-gray-700">queued</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Agents tab ───────────────────────────────────────────────────────────────
function AgentsTab({ repository }: { repository: RepositoryAnalysis }) {
  const orchestration = orchestrateAgents(repository)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = orchestration.agents.find(agent => agent.id === selectedId) ?? null
  const colors: Record<string, string> = { repository: "#818cf8", architecture: "#06b6d4", dependencies: "#a78bfa", security: "#f87171", "bug-risk": "#fb923c", metrics: "#34d399", documentation: "#fbbf24", "knowledge-graph": "#22d3ee", reasoning: "#c4b5fd" }
  const statusColor: Record<AgentResult["status"], string> = { READY: "#64748b", RUNNING: "#a5b4fc", COMPLETED: "#34d399", NO_DATA: "#fbbf24", FAILED: "#f87171" }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-5">
        <div className="section-label">Agent Pipeline · {orchestration.repository}</div>
        <div className="flex-1 h-px bg-[#1e1e35]" />
        <span className="text-xs font-mono px-2 py-1 rounded text-gray-400 border border-white/10">Deterministic inputs</span>
      </div>
      <div className="space-y-2">
      {orchestration.agents.map((agent, index) => (
        <div key={agent.id}>
          <button onClick={() => setSelectedId(selectedId === agent.id ? null : agent.id)} className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-xl border border-white/[0.08] bg-[#0e0e1a] hover:border-white/20 transition-colors">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: colors[agent.id] }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">{agent.name}</div>
            <div className="text-xs text-gray-500">Input: {agent.inputSource}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-xs" style={{ color: statusColor[agent.status] }}>{agent.status}</div>
            <div className="text-xs text-gray-600">{agent.output}</div>
          </div>
          <div className="text-xs text-gray-500 shrink-0">{agent.evidenceCount} evidence</div>
          </button>
          {index < orchestration.agents.length - 1 && <div className="h-3 border-l border-dashed border-cyan-400/30 ml-5" />}
          {selected?.id === agent.id && <div className="mt-2 ml-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4"><div className="text-xs text-gray-300">{agent.summary}</div><div className="mt-3 flex flex-wrap gap-2">{agent.evidence.map(item => <span key={item} className="rounded border border-white/10 px-2 py-1 text-xs text-gray-500">{item}</span>)}</div></div>}
        </div>
      ))}
      </div>
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-gray-500">AI Reasoning Agent is intentionally <span className="text-yellow-300">NO_DATA</span> until an LLM provider is configured. Deterministic analysis remains the source of truth.</div>
    </div>
  )
}

// ─── Bug Prediction tab ────────────────────────────────────────────────────────
function BugPredictionTab({ bugRisk: suppliedBugRisk }: { bugRisk?: BugRiskSummary | null }) {
  if (!suppliedBugRisk || suppliedBugRisk.status === "unavailable" || suppliedBugRisk.status === "failed") {
    return <div className="rounded-xl border border-white/[0.06] bg-[#0e0e1a] p-6 text-center text-sm text-gray-500">Bug Risk analysis unavailable. No risk findings are being inferred.</div>
  }
  if (suppliedBugRisk.status === "no_eligible_files") {
    return <div className="rounded-xl border border-white/[0.06] bg-[#0e0e1a] p-6 text-center text-sm text-gray-500">Bug Risk analysis completed with 0 eligible files. No risk findings were inferred.</div>
  }
  const bugRisk = suppliedBugRisk
  const groups = [
    { label: "Critical Risk Files", level: "critical", color: "#f87171" },
    { label: "High Risk Files", level: "high", color: "#fb923c" },
    { label: "Medium Risk Files", level: "medium", color: "#fbbf24" },
    { label: "Low Risk Files", level: "low", color: "#34d399" },
  ] as const
  const scoreColor = (score: number) => score >= 80 ? "#f87171" : score >= 60 ? "#fb923c" : score >= 30 ? "#fbbf24" : "#34d399"
  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total analyzed files", value: bugRisk.total_files_analyzed, color: "#a5b4fc" },
          { label: "High risk", value: bugRisk.high_risk_count, color: "#fb923c" },
          { label: "Medium risk", value: bugRisk.medium_risk_count, color: "#fbbf24" },
          { label: "Low risk", value: bugRisk.low_risk_count, color: "#34d399" },
          { label: "Critical", value: bugRisk.critical_count, color: "#f87171" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <div className="font-mono font-black text-2xl" style={{ color: s.color }}>{s.value.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 mb-6 text-xs text-gray-400">
        Predicted Bug Risk uses deterministic static heuristics from this repository's source evidence. It does not prove that a defect exists.
      </div>
      {groups.map(group => {
        const findings = bugRisk.findings.filter(finding => finding.level === group.level)
        return (
          <div key={group.level} className="mb-6">
            <div className="section-label mb-3" style={{ color: group.color }}>{group.label} ({findings.length})</div>
            <div className="space-y-2">
              {findings.length === 0 && <div className="text-xs text-gray-600 px-1">No files in this risk level.</div>}
              {findings.map(finding => (
                <div key={finding.path} className="px-4 py-3 glass rounded-xl">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm text-white break-all">{finding.path}</div>
                      <div className="flex gap-2 mt-2 flex-wrap text-xs text-gray-500">
                        <span>Complexity: {String(finding.evidence.ast_complexity ?? "unavailable")}</span>
                        <span>Coupling: {String(finding.evidence.dependency_count ?? 0)} deps / {String(finding.evidence.dependent_count ?? 0)} dependents</span>
                        <span>Documentation: {finding.evidence.documentation_coverage_percent == null ? "unavailable" : `${finding.evidence.documentation_coverage_percent}%`}</span>
                        <span>Security: {String(finding.evidence.security_finding_count ?? 0)} findings</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-black" style={{ color: scoreColor(finding.score) }}>{finding.score}</div>
                      <div className="text-xs capitalize" style={{ color: scoreColor(finding.score) }}>{finding.level}</div>
                    </div>
                  </div>
                  {finding.factors.length > 0 && <div className="flex gap-2 mt-3 flex-wrap">{finding.factors.map(factor => <span key={factor} className="text-xs text-gray-400 border border-white/[0.08] rounded px-2 py-1">{factor}</span>)}</div>}
                  <div className="text-xs text-gray-500 mt-3">{finding.explanation} Confidence: {finding.confidence}.</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Results View ─────────────────────────────────────────────────────────────
const RESULT_TABS = [
  { id: "overview",      label: "Overview" },
  { id: "architecture",  label: "Architecture" },
  { id: "knowledge",     label: "Knowledge Graph" },
  { id: "security",      label: "Security" },
  { id: "metrics",       label: "Metrics" },
  { id: "agents",        label: "Agents" },
  { id: "bugs",          label: "Bug Prediction" },
  { id: "docs",          label: "Documentation" },
  { id: "assistant",     label: "AI Insights" },
]

function ResultsView({ result, onReset }: {
  result: NonNullable<ReturnType<typeof useAnalysis>["result"]>
  onReset: () => void
}) {
  const [tab, setTab] = useState("overview")
  const { repository } = result
  const primaryLanguage = Object.entries(repository.languages).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "Unknown"
  const fullName = `${repository.owner}/${repository.name}`

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Completion banner */}
      <div className="flex items-center justify-between mb-6 glass rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-green-400" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">Analysis Complete</div>
            <div className="text-xs text-gray-500">
              {fullName} · {repository.stars.toLocaleString()} stars · completed at {result.completedAt}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-mono text-2xl font-black text-violet-400">{repository.structure.length.toLocaleString()}</div>
            <div className="text-xs text-gray-500">items indexed</div>
          </div>
          <button onClick={onReset} className="btn-secondary text-xs text-gray-400 px-3 py-1.5 rounded-lg">
            New Analysis
          </button>
        </div>
      </div>
      {import.meta.env.DEV && (
        <div className="mb-6 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] px-4 py-3 text-xs text-cyan-200">
          <div className="font-mono uppercase tracking-widest text-cyan-400">API source: CURRENT BACKEND</div>
          <div className="mt-2 grid gap-1 text-gray-300 sm:grid-cols-4">
            <span>Repository: {fullName}</span>
            <span>Source files: {repository.source_files_count}</span>
            <span>Security: {repository.security_analysis?.files_scanned ?? "unavailable"} scanned / {repository.security_analysis?.total_findings ?? "unavailable"} findings</span>
            <span>Bug Risk: {repository.bug_risk_analysis?.files_analyzed ?? "unavailable"} analyzed</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] mb-6 overflow-x-auto">
        {RESULT_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              tab === t.id ? "bg-violet-600/30 text-violet-300 border border-violet-500/30" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Repository Tree</div>
                <div className="glass rounded-xl p-4">
                  <RepositoryTree
                    structure={repository.structure}
                    repositoryName={fullName}
                    sourceFileCount={repository.source_files.length}
                    dependencyCount={repository.dependency_graph.edges.length}
                    primaryLanguage={primaryLanguage}
                    sourceFiles={repository.source_files}
                    astAnalyses={repository.ast_analysis}
                    dependencies={repository.dependency_analysis}
                    entityGraph={repository.entity_graph}
                  />
                </div>
              </div>
              <div>
                <div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Quick Metrics</div>
                <div className="space-y-3">
                  {[
                    { label: "Repository Items", value: repository.structure.length, color: "#8b5cf6" },
                    { label: "Source Files", value: repository.source_files.length, color: "#06b6d4" },
                    { label: "AST Analyses", value: repository.ast_analysis.length, color: "#34d399" },
                    { label: "Dependency Edges", value: repository.dependency_graph.edges.length, color: "#fbbf6e" },
                    { label: "Entity Nodes", value: repository.entity_graph.nodes.length, color: "#f472b6" },
                    { label: "Architecture Components", value: repository.architecture_analysis.components.length, color: "#ef4444" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                      <span className="text-xs text-gray-400 w-36 shrink-0">{s.label}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full">
                        <div className="h-full rounded-full" style={{ backgroundColor: s.color, width: `${Math.min(Number(s.value) * 4, 100)}%` }} />
                      </div>
                      <span className="font-mono text-sm font-bold w-12 text-right" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Risk summary */}
                <div className="mt-4 rounded-xl p-4 bg-[#0e0e1a] border border-yellow-500/15">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-400">Top Risk</span>
                  </div>
                  <div className="text-sm text-white font-medium">{repository.description ?? fullName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Default branch: {repository.default_branch} · Primary language: {primaryLanguage}</div>
                </div>
              </div>
            </div>
          )}

          {tab === "architecture" && (
            <div>
              <div className="flex items-center gap-4 mb-3 text-xs font-mono text-gray-500">
                <span>Components: <strong className="text-gray-300">{repository.architecture_analysis?.components?.length ?? 0}</strong></span>
                <span>Relationships: <strong className="text-gray-300">{repository.architecture_analysis?.relationships?.length ?? 0}</strong></span>
              </div>
              <ArchitectureGraph analysis={repository.architecture_analysis} />
            </div>
          )}
          {tab === "knowledge"    && <KnowledgeGraph graph={repository.entity_graph} />}
          {tab === "security"     && <SecurityPanel analysis={repository.security_analysis} />}
          {tab === "metrics"      && <MetricsPanel metrics={repository.metrics} />}
          {tab === "agents"       && <div className="glass rounded-2xl p-6"><AgentsTab repository={repository} /></div>}
          {tab === "bugs"         && <div className="glass rounded-2xl p-6"><BugPredictionTab bugRisk={repository.bug_risk_analysis} /></div>}
          {tab === "docs"         && <div className="glass rounded-2xl p-6"><DocumentationPanel analysis={repository.documentation_analysis} /></div>}
          {tab === "assistant"    && <div className="glass rounded-2xl p-6"><AIInsights repository={repository} /></div>}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Repository Analyzer (main export) ───────────────────────────────────────
export default function RepositoryAnalyzer({ initialUrl }: { initialUrl?: string }) {
  const { state, phases, currentPhase, phaseProgress, result, error, repoUrl, setRepoUrl, startAnalysis, reset } = useAnalysis()

  // Pre-fill URL from hero if provided
  useEffect(() => { if (initialUrl) setRepoUrl(initialUrl) }, [initialUrl, setRepoUrl])

  return (
    <section id="product" className="py-16 relative min-h-screen">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 55%)" }} />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section header — only when idle */}
        {(state === "idle" || state === "error") && (
          <div className="text-center mb-12">
            <div className="section-label mb-4">Repository Workspace</div>
            <h2 className="font-black text-white leading-tight" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
              Analyze Any Repository.
            </h2>
            <p className="mt-3 text-gray-500 text-sm max-w-lg mx-auto">
              Enter a public GitHub repository URL. RepoMind's 9 AI agents will recover architecture, map dependencies, and build a complete intelligence model.
            </p>
          </div>
        )}

        {/* State machine */}
        <AnimatePresence mode="wait">
          {(state === "idle" || state === "error") && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {error && (
                <div className="max-w-3xl mx-auto mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              <AnalysisInput repoUrl={repoUrl} setRepoUrl={setRepoUrl} onStart={startAnalysis} />
              {/* How it looks hint */}
              <div className="mt-10 text-center">
                <div className="inline-flex items-center gap-2 text-xs text-gray-600 font-mono">
                  <span className="w-px h-4 bg-gray-700" />
                  Analysis is processed by the RepoMind backend
                  <span className="w-px h-4 bg-gray-700" />
                </div>
              </div>
            </motion.div>
          )}

          {state === "running" && (
            <motion.div key="running" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AnalysisProgress currentPhase={currentPhase} phaseProgress={phaseProgress} repoUrl={repoUrl} />
            </motion.div>
          )}

          {state === "complete" && result && (
            <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ResultsView result={result} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
