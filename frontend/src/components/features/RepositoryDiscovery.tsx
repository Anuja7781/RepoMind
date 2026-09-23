import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Star, GitFork, CheckCircle2, Loader2, ChevronDown, ChevronUp, MessageSquare, Send, BarChart2 } from "lucide-react"
import {
  DISCOVERED_REPOS, SEARCH_SIM_STEPS, COMPARISON_CATEGORIES,
  type DiscoveredRepo, getDiscoveryResponse,
} from "@/data/discoveryData"

const SCORE_COLOR = (s: number) => s >= 80 ? "#34d399" : s >= 60 ? "#fbbf24" : "#f87171"

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const c = SCORE_COLOR(score)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1e1e35" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, backgroundColor: c }} />
      </div>
      <span className="text-xs font-mono font-bold w-6 text-right" style={{ color: c }}>{score}</span>
    </div>
  )
}

// ─── Repository Card ──────────────────────────────────────────────────────────
function RepoCard({ repo, rank, selected, onToggle }: {
  repo: DiscoveredRepo; rank: number; selected: boolean; onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isFirst = rank === 1
  const sc = SCORE_COLOR(repo.overallScore)
  const bd = [
    { key: "topicRelevance",  label: "Topic Relevance" },
    { key: "architecture",    label: "Architecture"    },
    { key: "codeQuality",     label: "Code Quality"    },
    { key: "documentation",   label: "Documentation"   },
    { key: "security",        label: "Security"        },
    { key: "maintainability", label: "Maintainability" },
    { key: "activity",        label: "Activity"        },
  ] as const

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{ background: "#12121f", border: `1px solid ${isFirst ? "rgba(91,80,240,0.4)" : "#1e1e35"}`, boxShadow: isFirst ? "0 0 0 1px rgba(91,80,240,0.08)" : "none" }}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isFirst ? "bg-violet-600 text-white" : ""}`}
            style={isFirst ? {} : { background: "#1e1e35", color: "#475569" }}>#{rank}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="font-semibold text-gray-400 text-sm">{repo.owner}/</span>
              <span className="font-bold text-violet-400 text-sm">{repo.name}</span>
              {isFirst && (
                <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{ background: "rgba(91,80,240,0.1)", border: "1px solid rgba(91,80,240,0.28)", color: "#a5b4fc" }}>
                  Recommended
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{repo.description}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs text-gray-600 flex items-center gap-1"><Star size={10} className="text-yellow-500" />{repo.stars.toLocaleString()}</span>
              <span className="text-xs text-gray-600 flex items-center gap-1"><GitFork size={10} />{repo.forks}</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: "#1e1e35", color: "#94a3b8" }}>{repo.language}</span>
              <span className="text-xs text-gray-600">{repo.lastCommit}</span>
            </div>
          </div>

          <div className="shrink-0 text-center">
            <div className="font-black font-mono text-2xl animate-score-reveal" style={{ color: sc }}>{repo.overallScore}</div>
            <div className="text-xs" style={{ color: "#475569" }}>/ 100</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {repo.topicMatches.slice(0, 3).map(t => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", color: "#67e8f9" }}>{t}</span>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button onClick={onToggle}
            className={`flex-1 text-xs py-1.5 rounded-lg border font-medium transition-all ${selected ? "bg-violet-600 border-violet-600 text-white" : "text-gray-500 hover:text-violet-400 hover:border-violet-500/40"}`}
            style={selected ? {} : { background: "transparent", borderColor: "#2a2a45" }}>
            {selected ? "✓ Added" : "Add to Comparison"}
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition-colors px-2 py-1.5">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Details
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            className="overflow-hidden" style={{ borderTop: "1px solid #1e1e35" }}>
            <div className="px-4 py-4 space-y-4">
              <div>
                <div className="text-xs font-semibold mb-2 text-gray-400">Score Breakdown</div>
                <div className="space-y-1.5">
                  {bd.map(e => (
                    <div key={e.key} className="flex items-center gap-2">
                      <span className="text-xs w-28 shrink-0" style={{ color: "#475569" }}>{e.label}</span>
                      <ScoreBar score={repo.breakdown[e.key]} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold mb-2 text-gray-400">Architecture Stack</div>
                <div className="flex flex-wrap gap-1.5">
                  {repo.architecture.map((layer, i) => (
                    <span key={layer} className="text-xs px-2 py-1 rounded-lg font-mono"
                      style={{ background: `rgba(${[91,182,52,248,251,6,219][i % 7]},${[80,212,211,113,191,182,39][i % 7]},${[240,212,153,113,36,212,39][i % 7]},0.08)`, color: "#94a3b8", border: "1px solid #2a2a45" }}>
                      {layer}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "Test Coverage", value: `${repo.testCoverage}%` },
                  { label: "Security Issues", value: repo.securityIssues, warn: repo.securityIssues > 5 },
                  { label: "Dependencies",   value: repo.dependencies },
                  { label: "Lines of Code",  value: `${(repo.linesOfCode / 1000).toFixed(1)}k` },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 rounded-lg" style={{ background: "#0d0d18", border: "1px solid #1e1e35" }}>
                    <div className="font-mono font-bold text-sm" style={{ color: (s as any).warn ? "#f87171" : "#e2e8f0" }}>{s.value}</div>
                    <div className="text-xs leading-tight mt-0.5" style={{ color: "#475569" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs font-semibold mb-1.5 text-emerald-400">Strengths</div>
                  {repo.strengths.map(s => (
                    <div key={s} className="text-xs text-gray-500 flex gap-1.5 items-start mb-1">
                      <span className="text-emerald-500 mt-0.5">✓</span>{s}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1.5 text-red-400">Weaknesses</div>
                  {repo.weaknesses.map(w => (
                    <div key={w} className="text-xs text-gray-500 flex gap-1.5 items-start mb-1">
                      <span className="text-red-500 mt-0.5">✗</span>{w}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Comparison Table ──────────────────────────────────────────────────────────
function ComparisonTable({ repos }: { repos: DiscoveredRepo[] }) {
  const getCellStyle = (raw: number | undefined, inverse?: boolean) => {
    if (raw === undefined) return { color: "#2a2a45" }
    const v = inverse ? Math.max(0, 100 - raw * 8) : raw
    const c = v >= 80 ? "#34d399" : v >= 60 ? "#fbbf24" : "#f87171"
    return { color: c }
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #1e1e35" }}>
        <BarChart2 size={14} className="text-violet-400" />
        <span className="text-sm font-semibold text-white">Comparison ({repos.length} repositories)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#0d0d18" }}>
              <th className="text-left px-4 py-2.5 w-36" style={{ color: "#475569" }}>Metric</th>
              {repos.map(r => (
                <th key={r.id} className="text-center px-3 py-2.5 font-semibold text-violet-400">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON_CATEGORIES.map(cat => (
              <tr key={cat.key} style={{ borderTop: "1px solid #1e1e35" }}
                className="transition-colors hover:bg-white/[0.02]">
                <td className="px-4 py-2 text-gray-500">{cat.label}</td>
                {repos.map(r => {
                  const raw = cat.key === "overallScore"
                    ? r.overallScore
                    : (cat as any).breakdownKey
                      ? (r.breakdown as any)[cat.key]
                      : (r as any)[cat.key]
                  return (
                    <td key={r.id} className="text-center px-3 py-2 font-mono font-bold"
                      style={getCellStyle(typeof raw === "number" ? raw : undefined, (cat as any).inverse)}>
                      {typeof raw === "number" ? raw : "—"}
                      {cat.key === "testCoverage" && typeof raw === "number" ? "%" : ""}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── AI Assistant ──────────────────────────────────────────────────────────────
function DiscoveryAssistant() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "I've analyzed all discovered repositories. Ask me anything — why a repo was recommended, how they compare, security differences, or which fits your project best." },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, typing])

  const send = (q?: string) => {
    const text = q ?? input.trim()
    if (!text) return
    setInput("")
    setMessages(m => [...m, { role: "user", text }])
    setTyping(true)
    setTimeout(() => {
      setMessages(m => [...m, { role: "ai", text: getDiscoveryResponse(text).text }])
      setTyping(false)
    }, 900 + Math.random() * 600)
  }

  const SUGGESTED = ["Why is Repository A recommended?", "Compare security scores", "Why does B score lower?"]

  return (
    <div className="rounded-xl overflow-hidden flex flex-col" style={{ height: 380, background: "#12121f", border: "1px solid #1e1e35" }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid #1e1e35" }}>
        <MessageSquare size={13} className="text-violet-400" />
        <span className="text-sm font-semibold text-white">Discovery AI Assistant</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === "user" ? "bg-violet-600 text-white" : "text-gray-400"}`}
              style={m.role === "ai" ? { background: "#1a1a2e", border: "1px solid #2a2a45" } : {}}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-xl px-3 py-2 flex gap-1" style={{ background: "#1a1a2e", border: "1px solid #2a2a45" }}>
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                  style={{ background: "#475569", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-3 py-2 space-y-2" style={{ borderTop: "1px solid #1e1e35" }}>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED.map(s => (
            <button key={s} onClick={() => send(s)}
              className="text-xs px-2 py-1 rounded-full transition-colors text-violet-400 hover:text-violet-300"
              style={{ background: "rgba(91,80,240,0.08)", border: "1px solid rgba(91,80,240,0.22)" }}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Ask about the repositories…"
            className="flex-1 text-xs px-3 py-1.5 rounded-lg outline-none transition-all"
            style={{ background: "#0a0a0f", border: "1px solid #2a2a45", color: "#e2e8f0" }}
            onFocus={e => { e.target.style.borderColor = "rgba(91,80,240,0.5)" }}
            onBlur={e => { e.target.style.borderColor = "#2a2a45" }} />
          <button onClick={() => send()} disabled={!input.trim()}
            className="px-3 py-1.5 rounded-lg text-white transition-colors disabled:opacity-40"
            style={{ background: "#5b50f0" }}>
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RepositoryDiscovery() {
  const [topic, setTopic] = useState("")
  const [simState, setSimState] = useState<"idle" | "running" | "complete">("idle")
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<"results" | "compare" | "ai">("results")

  const runSearch = () => {
    if (!topic.trim()) return
    setSimState("running"); setCurrentStep(0); setCompletedSteps(new Set())
    let i = 0
    const next = () => {
      setCurrentStep(i)
      setTimeout(() => {
        setCompletedSteps(prev => new Set([...prev, i]))
        i++
        if (i < SEARCH_SIM_STEPS.length) next()
        else setSimState("complete")
      }, SEARCH_SIM_STEPS[i].duration)
    }
    next()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 5) next.add(id)
      return next
    })
  }

  const recommended = DISCOVERED_REPOS[0]
  const comparedRepos = DISCOVERED_REPOS.filter(r => selectedIds.has(r.id))

  return (
    <div className="min-h-screen" style={{ background: "#0d0d18" }}>
      {/* Header */}
      <div style={{ background: "#12121f", borderBottom: "1px solid #1e1e35" }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.25)" }}>
              <Search size={16} className="text-cyan-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Multi-Repository Discovery</h1>
          </div>
          <p className="text-gray-500 text-sm ml-11 font-mono">// Find and rank repositories that match your project topic</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Search */}
        <div className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
          <div className="text-sm font-semibold text-white mb-3">Describe your project topic</div>
          <div className="flex gap-3">
            <input value={topic} onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runSearch()}
              placeholder="e.g. AI-based traffic light management with computer vision and adaptive signal control"
              className="flex-1 text-sm px-4 py-2.5 rounded-xl outline-none transition-all"
              style={{ background: "#0a0a0f", border: "1px solid #2a2a45", color: "#e2e8f0" }}
              onFocus={e => { e.target.style.borderColor = "rgba(91,80,240,0.5)" }}
              onBlur={e => { e.target.style.borderColor = "#2a2a45" }} />
            <button onClick={runSearch} disabled={!topic.trim() || simState === "running"}
              className="px-6 py-2.5 btn-primary rounded-xl text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              {simState === "running" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {simState === "running" ? "Searching…" : "Discover"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {["AI traffic management system","Real-time vehicle detection","Smart city IoT platform","Adaptive signal control ML"].map(t => (
              <button key={t} onClick={() => setTopic(t)}
                className="text-xs px-3 py-1.5 rounded-full transition-colors text-gray-500 hover:text-violet-400"
                style={{ background: "#0a0a0f", border: "1px solid #1e1e35" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Simulation progress */}
        <AnimatePresence>
          {simState === "running" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
              <div className="text-sm font-semibold text-white mb-3">Searching repositories…</div>
              <div className="space-y-2">
                {SEARCH_SIM_STEPS.map((step, i) => {
                  const done = completedSteps.has(i)
                  const active = i === currentStep && !done
                  return (
                    <div key={step.id} className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-all ${active ? "animate-agent-pulse" : ""}`}
                      style={{ background: active ? "rgba(91,80,240,0.08)" : "transparent", border: active ? "1px solid rgba(91,80,240,0.2)" : "1px solid transparent" }}>
                      {done    ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        : active ? <Loader2 size={13} className="animate-spin text-violet-400 shrink-0" />
                        : <div className="w-3 h-3 rounded-full shrink-0" style={{ background: "#2a2a45" }} />}
                      <span className={`text-sm ${active ? "text-white font-medium" : done ? "text-gray-600" : "text-gray-600"}`}>{step.label}</span>
                      {step.count && done && (
                        <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "#34d399" }}>
                          {step.count}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {simState === "complete" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Repositories Searched", value: "24" },
                  { label: "Analyzed",               value: "5"  },
                  { label: "Recommended",            value: "1"  },
                  { label: "Average Score",          value: "80" },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-4 text-center animate-score-reveal"
                    style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
                    <div className="text-2xl font-black font-mono text-violet-400">{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Tabs */}
              <div className="tab-bar">
                {([
                  { key: "results", label: "Results (5)" },
                  { key: "compare", label: `Compare (${selectedIds.size})` },
                  { key: "ai",      label: "AI Assistant" },
                ] as const).map(t => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className={`tab-item ${activeTab === t.key ? "active" : ""}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Results tab */}
              {activeTab === "results" && (
                <div className="space-y-3 animate-tab-enter">
                  {selectedIds.size > 0 && (
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs text-gray-500">{selectedIds.size} selected</span>
                      <button onClick={() => setActiveTab("compare")}
                        className="text-xs text-violet-400 font-semibold hover:underline">Compare now →</button>
                    </div>
                  )}
                  {DISCOVERED_REPOS.map((repo, i) => (
                    <RepoCard key={repo.id} repo={repo} rank={i + 1}
                      selected={selectedIds.has(repo.id)} onToggle={() => toggleSelect(repo.id)} />
                  ))}

                  {/* Recommendation */}
                  <div className="rounded-xl p-5" style={{ background: "rgba(91,80,240,0.07)", border: "1px solid rgba(91,80,240,0.22)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={15} className="text-violet-400" />
                      <span className="text-sm font-bold text-violet-300">Recommended Repository</span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-mono text-gray-500">{recommended.owner}/</span>
                      <span className="font-bold text-violet-400 font-mono">{recommended.name}</span>
                      <span className="font-black font-mono text-2xl text-violet-300 ml-2">{recommended.overallScore}/100</span>
                    </div>
                    <div className="space-y-1.5">
                      {recommended.whyRecommended.map((reason, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <span className="text-violet-500 mt-0.5 shrink-0">→</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "compare" && (
                <div className="animate-tab-enter">
                  {comparedRepos.length < 2 ? (
                    <div className="rounded-xl p-10 text-center" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
                      <div className="text-gray-500 text-sm mb-2">Select at least 2 repositories to compare</div>
                      <button onClick={() => setActiveTab("results")}
                        className="text-xs text-violet-400 font-semibold hover:underline">← Go to results</button>
                    </div>
                  ) : (
                    <ComparisonTable repos={comparedRepos} />
                  )}
                </div>
              )}

              {activeTab === "ai" && (
                <div className="animate-tab-enter">
                  <DiscoveryAssistant />
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

        {/* Idle state */}
        {simState === "idle" && (
          <div className="rounded-xl p-10 text-center" style={{ background: "#12121f", border: "1px dashed #1e1e35" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
              <Search size={22} className="text-cyan-400" />
            </div>
            <div className="text-sm font-medium text-gray-400 mb-1">Enter a project topic above</div>
            <div className="text-xs text-gray-600">RepoMind AI will search and rank the best matching repositories</div>
          </div>
        )}

      </div>
    </div>
  )
}
