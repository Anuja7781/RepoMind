import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GitBranch as GitBranchIcon, Loader2, CheckCircle2, ChevronRight, AlertTriangle, GitBranch, Star, GitFork } from "lucide-react"
import { PRESET_REPOS, ANALYSIS_PHASES } from "@/data/mockRepo"
import { useAnalysis } from "@/hooks/useAnalysis"
import ArchitectureGraph from "./ArchitectureGraph"
import KnowledgeGraph from "./KnowledgeGraph"
import RepositoryTree from "./RepositoryTree"
import SecurityPanel from "./SecurityPanel"
import MetricsPanel from "./MetricsPanel"
import DocumentationPanel from "./DocumentationPanel"
import AIAssistant from "./AIAssistant"

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

// ─── Agent Activity ───────────────────────────────────────────────────────────
function AgentActivity({ agents }: { agents: ReturnType<typeof useAnalysis>["agents"] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto mt-6"
    >
      <div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">AI Agent Activity</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {agents.map(agent => (
          <motion.div
            key={agent.id}
            layout
            className="rounded-xl px-4 py-3 flex items-center gap-3 bg-[#0e0e1a] border transition-all duration-300"
            style={{ borderColor: agent.status === "running" || agent.status === "analyzing" ? `${agent.color}40` : agent.status === "complete" ? `${agent.color}20` : "rgba(255,255,255,0.05)" }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${agent.color}15`, border: `1px solid ${agent.color}25` }}>
              <span className="font-mono text-sm" style={{ color: agent.color }}>{agent.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-300 truncate">{agent.name}</div>
              <div className="text-xs text-gray-600 truncate">{agent.description}</div>
              {(agent.status === "running" || agent.status === "analyzing") && (
                <div className="mt-1 h-0.5 bg-white/10 rounded-full">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: agent.color }}
                    animate={{ width: `${agent.progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              {agent.status === "complete" ? (
                <div>
                  <CheckCircle2 size={13} style={{ color: agent.color }} className="ml-auto mb-0.5" />
                  <div className="font-mono text-xs" style={{ color: agent.color }}>{agent.findings} found</div>
                </div>
              ) : agent.status === "running" || agent.status === "analyzing" ? (
                <Loader2 size={13} style={{ color: agent.color }} className="animate-spin ml-auto" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-gray-700 ml-auto" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Agents tab ───────────────────────────────────────────────────────────────
function AgentsTab() {
  const AGENTS = [
    { name: "Repository Analyzer",  purpose: "Scans structure, parses AST, maps all files", status: "complete",  color: "#818cf8", findings: 2400, task: "AST parsed 2,400 files" },
    { name: "Architecture Agent",   purpose: "Recovers layers, groups, entry points",        status: "complete",  color: "#06b6d4", findings: 18,   task: "12 layers, 6 groups recovered" },
    { name: "Dependency Agent",     purpose: "Maps import/export and coupling graph",         status: "complete",  color: "#a78bfa", findings: 486,  task: "486 dependency edges" },
    { name: "Security Agent",       purpose: "Detects vulnerabilities and risk patterns",     status: "complete",  color: "#f87171", findings: 7,    task: "7 security findings" },
    { name: "Bug Risk Agent",       purpose: "Predicts high-risk files and patterns",         status: "complete",  color: "#fb923c", findings: 12,   task: "12 high-risk modules" },
    { name: "Documentation Agent",  purpose: "Analyzes and generates documentation intel",   status: "complete",  color: "#34d399", findings: 94,   task: "94 modules documented" },
    { name: "Impact Agent",         purpose: "Models change propagation paths",               status: "complete",  color: "#fbbf24", findings: 8,    task: "8 impact paths modeled" },
    { name: "Drift Agent",          purpose: "Compares design vs actual architecture",        status: "complete",  color: "#f472b6", findings: 4,    task: "4 drift violations detected" },
    { name: "AI Assistant",         purpose: "Embeds knowledge into RAG for Q&A",            status: "complete",  color: "#67e8f9", findings: 1,    task: "Knowledge base ready" },
  ]
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-5">
        <div className="section-label">9 Specialized Agents</div>
        <div className="flex-1 h-px bg-[#1e1e35]" />
        <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>All Complete</span>
      </div>
      {AGENTS.map((a, i) => (
        <div key={a.name} className="flex items-center gap-4 px-4 py-3 rounded-xl agent-complete" style={{ border: "1px solid rgba(52,211,153,0.22)", animationDelay: `${i * 40}ms` }}>
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white">{a.name}</div>
            <div className="text-xs text-gray-500">{a.purpose}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-xs" style={{ color: a.color }}>{a.findings.toLocaleString()} found</div>
            <div className="text-xs text-gray-600">{a.task}</div>
          </div>
          <CheckCircle2 size={14} className="text-green-400 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// ─── Bug Prediction tab ────────────────────────────────────────────────────────
function BugPredictionTab() {
  const HIGH_RISK = [
    { file: "next-server.ts",      risk: 91, factors: ["Complexity 142", "14 couplings", "38% coverage"], lang: "TS" },
    { file: "app/router/index.ts", risk: 78, factors: ["Complexity 98",  "9 couplings",  "52% coverage"], lang: "TS" },
    { file: "lib/cache.ts",        risk: 71, factors: ["Complexity 74",  "11 couplings", "41% coverage"], lang: "TS" },
    { file: "api/payment.ts",      risk: 65, factors: ["Complexity 61",  "7 couplings",  "28% coverage"], lang: "TS" },
  ]
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "High Risk Files",  value: "4",  color: "#f87171" },
          { label: "Medium Risk",      value: "12", color: "#fbbf24" },
          { label: "Low Risk",         value: "78", color: "#34d399" },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <div className="font-mono font-black text-2xl" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="section-label mb-3">High Risk Files</div>
      <div className="space-y-2">
        {HIGH_RISK.map(f => (
          <div key={f.file} className="flex items-center gap-4 px-4 py-3 glass rounded-xl">
            <div className="font-mono text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(91,80,240,0.12)", color: "#a5b4fc", border: "1px solid rgba(91,80,240,0.2)" }}>{f.lang}</div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-white">{f.file}</div>
              <div className="flex gap-2 mt-1 flex-wrap">
                {f.factors.map(fac => (
                  <span key={fac} className="text-xs text-gray-500">{fac}</span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="font-mono font-black" style={{ color: f.risk > 80 ? "#f87171" : f.risk > 65 ? "#fbbf24" : "#34d399" }}>{f.risk}</div>
              <div className="text-xs text-gray-600">risk</div>
            </div>
          </div>
        ))}
      </div>
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
  { id: "assistant",     label: "AI Assistant" },
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
                <span>Components: <strong className="text-gray-300">{repository.architecture_analysis.components.length}</strong></span>
                <span>Relationships: <strong className="text-gray-300">{repository.architecture_analysis.relationships.length}</strong></span>
              </div>
              <ArchitectureGraph analysis={repository.architecture_analysis} />
            </div>
          )}
          {tab === "knowledge"    && <KnowledgeGraph graph={repository.entity_graph} />}
          {tab === "security"     && <SecurityPanel analysis={repository.security_analysis} />}
          {tab === "metrics"      && <MetricsPanel metrics={repository.metrics} />}
          {tab === "agents"       && <div className="glass rounded-2xl p-6"><AgentsTab /></div>}
          {tab === "bugs"         && <div className="glass rounded-2xl p-6"><BugPredictionTab /></div>}
          {tab === "docs"         && <div className="glass rounded-2xl p-6"><DocumentationPanel analysis={repository.documentation_analysis} /></div>}
          {tab === "assistant"    && (
            <div className="glass rounded-2xl p-6">
              <AIAssistant />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Repository Analyzer (main export) ───────────────────────────────────────
export default function RepositoryAnalyzer({ initialUrl }: { initialUrl?: string }) {
  const { state, phases, currentPhase, phaseProgress, agents, result, error, repoUrl, setRepoUrl, startAnalysis, reset } = useAnalysis()

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
