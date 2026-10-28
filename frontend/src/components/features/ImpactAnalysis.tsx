import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Loader2, ChevronDown, AlertTriangle, Zap } from "lucide-react"
import {
  IMPACT_TARGETS, CHANGE_TYPES, SIM_STEPS,
  getImpactResult,
  type ImpactNode, type ImpactResult,
} from "@/data/impactData"

type SimState = "idle" | "running" | "complete"

const RISK_COLOR: Record<string, string> = { high: "#f87171", medium: "#fbbf24", low: "#34d399" }
const REL_LABEL: Record<string, string> = { source: "Changed", used_by: "Used by", calls: "Calls", tested_by: "Tests", affects_api: "API" }

// ─── Impact Dependency Graph ──────────────────────────────────────────────────
function ImpactGraph({ result, onSelectNode }: { result: ImpactResult; onSelectNode: (n: ImpactNode) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.9)
  const dragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as Element).closest("[data-inode]")) return
    dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - lastPos.current.x; const dy = e.clientY - lastPos.current.y
    lastPos.current = { x: e.clientX, y: e.clientY }
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
  }
  const onMouseUp = () => { dragging.current = false }
  const onWheel = (e: React.WheelEvent) => { e.preventDefault(); setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001))) }

  const { nodes, edges } = result
  const getN = (id: string) => nodes.find(n => n.id === id)
  const activeIds = hovered
    ? edges.filter(e => e.source === hovered || e.target === hovered).flatMap(e => [e.source, e.target])
    : []

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height: 380, background: "#0a0a0f", border: "1px solid #1e1e35" }}>
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        {["+","−"].map((c, i) => (
          <button key={c} onClick={() => setZoom(z => i === 0 ? Math.min(2.5, z + 0.15) : Math.max(0.4, z - 0.15))}
            className="w-7 h-7 rounded-md text-gray-400 hover:text-gray-200 text-sm flex items-center justify-center transition-colors"
            style={{ background: "#12121f", border: "1px solid #2a2a45" }}>{c}</button>
        ))}
        <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(0.9) }}
          className="h-7 px-2 rounded-md text-gray-400 hover:text-gray-200 text-xs transition-colors"
          style={{ background: "#12121f", border: "1px solid #2a2a45" }}>Reset</button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2">
        {[["#f87171","High risk"],["#fbbf24","Medium risk"],["#34d399","Low risk"]].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
            style={{ background: "#12121f", border: "1px solid #1e1e35", color: "#64748b" }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />{l}
          </div>
        ))}
      </div>

      <svg className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp} onWheel={onWheel} style={{ userSelect: "none" }}>
        <defs>
          <marker id="ia-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="#2a2a45" />
          </marker>
          <marker id="ia-arrow-active" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill="#818cf8" />
          </marker>
          <filter id="ia-glow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <pattern id="ia-grid" width="25" height="25" patternUnits="userSpaceOnUse">
            <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(91,80,240,0.07)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <g transform={`translate(${pan.x + 40},${pan.y + 20}) scale(${zoom})`}>
          <rect x="-200" y="-100" width="900" height="700" fill="url(#ia-grid)" />
          {edges.map((edge, i) => {
            const s = getN(edge.source); const t = getN(edge.target)
            if (!s || !t) return null
            const isAct = activeIds.includes(edge.source) && activeIds.includes(edge.target)
            return (
              <g key={i}>
                <line x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke={isAct ? "#818cf8" : "#2a2a45"} strokeWidth={isAct ? 2 : 0.8}
                  strokeDasharray={isAct ? "8 4" : undefined}
                  markerEnd={`url(#ia-arrow${isAct ? "-active" : ""})`}
                  className={isAct ? "animate-edge-flow" : ""}
                  style={{ transition: "stroke 0.2s, stroke-width 0.2s" }} />
                {isAct && (
                  <text x={(s.x + t.x) / 2} y={(s.y + t.y) / 2 - 6}
                    textAnchor="middle" fill="#818cf8" fontSize="8" fontFamily="JetBrains Mono" opacity="0.85">
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}
          {nodes.map(node => {
            const isHov = hovered === node.id
            const isConn = activeIds.includes(node.id)
            const dim = hovered !== null && !isHov && !isConn
            const rc = RISK_COLOR[node.riskLevel]
            const isSrc = node.relationship === "source"
            const r = isSrc ? 28 : 20
            return (
              <g key={node.id} data-inode="true"
                transform={`translate(${node.x},${node.y})`}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectNode(node)}
                style={{ cursor: "pointer" }}>
                {isHov && <circle r={r + 12} fill={rc} opacity="0.07" className="animate-pulse-soft" />}
                <circle r={r + 5} fill={rc} opacity={isHov ? 0.12 : 0.03} style={{ transition: "opacity 0.2s" }} />
                <circle r={r}
                  fill={isSrc ? "rgba(91,80,240,0.25)" : isHov ? "rgba(91,80,240,0.15)" : "#12121f"}
                  stroke={isHov || isConn ? rc : isSrc ? "#5b50f0" : "#2a2a45"}
                  strokeWidth={isSrc ? 2 : isHov ? 1.5 : 1}
                  opacity={dim ? 0.25 : 1}
                  filter={isHov ? "url(#ia-glow)" : undefined}
                  style={{ transition: "all 0.2s" }} />
                {!isSrc && (
                  <circle cx={r - 3} cy={-(r - 3)} r="4" fill={rc} opacity={dim ? 0.15 : 0.9}
                    style={{ transition: "opacity 0.2s" }} />
                )}
                <text textAnchor="middle" dominantBaseline="middle" y={-3}
                  fill={dim ? "#2a2a45" : isHov ? "#e2e8f0" : "#94a3b8"}
                  fontSize={isSrc ? "9" : "8"} fontFamily="Inter"
                  fontWeight={isSrc ? "700" : "500"} style={{ transition: "fill 0.2s" }}>
                  {node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label}
                </text>
                <text textAnchor="middle" y={8} fill={dim ? "#1e1e35" : "#475569"} fontSize="7" fontFamily="JetBrains Mono">
                  {REL_LABEL[node.relationship]}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ImpactAnalysis() {
  const [targetId, setTargetId] = useState("payment")
  const [changeTypeId, setChangeTypeId] = useState("remove-file")
  const [simState, setSimState] = useState<SimState>("idle")
  const [currentStep, setCurrentStep] = useState(-1)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [result, setResult] = useState<ImpactResult | null>(null)
  const [selectedNode, setSelectedNode] = useState<ImpactNode | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const target = IMPACT_TARGETS.find(t => t.id === targetId)!
  const changeType = CHANGE_TYPES.find(c => c.id === changeTypeId)!

  const simulate = () => {
    timers.current.forEach(clearTimeout); timers.current = []
    setSimState("running"); setCurrentStep(0); setCompletedSteps(new Set()); setResult(null); setSelectedNode(null)
    let elapsed = 0
    SIM_STEPS.forEach((step, i) => {
      const t1 = setTimeout(() => setCurrentStep(i), elapsed)
      elapsed += step.duration
      const t2 = setTimeout(() => setCompletedSteps(prev => new Set([...prev, i])), elapsed - 100)
      timers.current.push(t1, t2)
    })
    const done = setTimeout(() => {
      setSimState("complete"); setResult(getImpactResult(targetId, changeTypeId))
    }, elapsed + 200)
    timers.current.push(done)
  }

  const reset = () => {
    timers.current.forEach(clearTimeout)
    setSimState("idle"); setCurrentStep(-1); setCompletedSteps(new Set()); setResult(null); setSelectedNode(null)
  }

  const SELECT_CLS = "w-full rounded-lg px-3 py-2.5 text-sm font-mono appearance-none pr-8 focus:outline-none transition-all"
  const SELECT_STYLE = { background: "#0a0a0f", border: "1px solid #2a2a45", color: "#e2e8f0" }

  return (
    <div className="min-h-screen" style={{ background: "#0d0d18" }}>
      {/* Header */}
      <div style={{ background: "#12121f", borderBottom: "1px solid #1e1e35" }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(91,80,240,0.12)", border: "1px solid rgba(91,80,240,0.28)" }}>
              <Zap size={16} className="text-violet-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Change Impact Analysis</h1>
          </div>
          <p className="text-gray-500 text-sm ml-11 font-mono">// What happens if I change the code?</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ─── Left panel ─────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Repo info */}
            <div className="rounded-xl p-4" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Repository</div>
              <div className="font-semibold text-white">example-project</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Health Score</span>
                <span className="font-mono text-sm font-bold text-emerald-400">87 / 100</span>
              </div>
            </div>

            {/* Selectors */}
            <div className="rounded-xl p-4 space-y-4" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: "#475569" }}>Select What to Change</div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">File / Function / Module</label>
                <div className="relative">
                  <select value={targetId} onChange={e => setTargetId(e.target.value)}
                    className={SELECT_CLS} style={SELECT_STYLE}>
                    {IMPACT_TARGETS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
                <div className="mt-1.5 font-mono text-xs truncate" style={{ color: "#475569" }}>{target.path}</div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Change Type</label>
                <div className="relative">
                  <select value={changeTypeId} onChange={e => setChangeTypeId(e.target.value)}
                    className={SELECT_CLS} style={SELECT_STYLE}>
                    {CHANGE_TYPES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Action button */}
            <button onClick={simState === "idle" ? simulate : reset}
              className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${simState === "idle" ? "btn-primary" : simState === "running" ? "cursor-not-allowed" : "btn-outline"}`}
              style={simState === "running" ? { background: "#12121f", border: "1px solid #2a2a45", color: "#475569" } : undefined}
              disabled={simState === "running"}>
              {simState === "idle"    && <><Zap size={15} /> Simulate Impact</>}
              {simState === "running" && <><Loader2 size={15} className="animate-spin" /> Analyzing…</>}
              {simState === "complete" && "↺ Reset"}
            </button>

            {/* Agent involvement */}
            {result && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
                <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Agents Involved</div>
                <div className="space-y-1.5">
                  {result.involvedAgents.map(agent => (
                    <div key={agent} className="flex items-center gap-2">
                      <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                      <span className="text-xs text-gray-400">{agent}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ─── Center + Right ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Simulation steps */}
            <AnimatePresence>
              {simState !== "idle" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-white">Impact Analysis Pipeline</div>
                    {simState === "complete" && (
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", color: "#34d399" }}>
                        Complete ✓
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {SIM_STEPS.map((step, i) => {
                      const done = completedSteps.has(i)
                      const active = currentStep === i && !done
                      return (
                        <div key={step.id} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${active ? "animate-agent-pulse" : ""}`}
                          style={{ background: active ? "rgba(91,80,240,0.08)" : "transparent", border: active ? "1px solid rgba(91,80,240,0.2)" : "1px solid transparent" }}>
                          <div className="w-5 h-5 flex items-center justify-center shrink-0">
                            {done    ? <CheckCircle2 size={13} className="text-emerald-500" />
                              : active ? <Loader2 size={13} className="text-violet-400 animate-spin" />
                              : <div className="w-3 h-3 rounded-full" style={{ background: "#2a2a45" }} />}
                          </div>
                          <span className={`text-sm transition-colors ${done ? "text-gray-600" : active ? "text-white font-medium" : "text-gray-600"}`}>{step.label}</span>
                          {done   && <span className="ml-auto text-xs font-mono text-emerald-500">✓</span>}
                          {active && <span className="ml-auto text-xs font-mono text-violet-400 animate-pulse-soft">running</span>}
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                  {/* Score banner */}
                  <div className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "#475569" }}>Impact Score</div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-black animate-score-reveal"
                            style={{ fontSize: "2.5rem", color: result.level === "HIGH" ? "#f87171" : result.level === "MEDIUM" ? "#fbbf24" : "#34d399" }}>
                            {result.score}
                          </span>
                          <span className="text-gray-600 text-lg">/ 100</span>
                          <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border"
                            style={result.level === "HIGH"
                              ? { background: "rgba(248,113,113,0.1)", color: "#f87171", borderColor: "rgba(248,113,113,0.25)" }
                              : { background: "rgba(251,191,36,0.1)", color: "#fbbf24", borderColor: "rgba(251,191,36,0.25)" }}>
                            {result.level}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Confidence: {result.confidence}%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono" style={{ color: "#475569" }}>Change</div>
                        <div className="text-sm font-semibold text-gray-300">{changeType.label}</div>
                        <div className="font-mono text-xs text-violet-400 mt-0.5">{target.label}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {[
                      ["Files",     result.filesAffected,     "#818cf8"],
                      ["Functions", result.functionsAffected, "#06b6d4"],
                      ["Modules",   result.modulesAffected,   "#34d399"],
                      ["APIs",      result.apisAffected,      "#f87171"],
                      ["Tests",     result.testsAffected,     "#fbbf24"],
                      ["Deps",      result.depsAffected,      "#a78bfa"],
                    ].map(([l, v, c]) => (
                      <div key={l as string} className="rounded-xl p-3 text-center"
                        style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
                        <div className="font-mono font-black text-2xl animate-score-reveal" style={{ color: c as string }}>{v}</div>
                        <div className="text-xs mt-0.5 leading-tight" style={{ color: "#475569" }}>{l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Impact graph */}
                  <div className="rounded-xl p-4" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-white">Dependency Impact Graph</div>
                      <div className="text-xs font-mono" style={{ color: "#475569" }}>Hover to explore · Click for detail</div>
                    </div>
                    <ImpactGraph result={result} onSelectNode={setSelectedNode} />

                    <AnimatePresence>
                      {selectedNode && (
                        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="mt-4 rounded-lg p-4 animate-expand-in"
                          style={{
                            background: selectedNode.riskLevel === "high" ? "rgba(248,113,113,0.07)" : selectedNode.riskLevel === "medium" ? "rgba(251,191,36,0.07)" : "rgba(52,211,153,0.07)",
                            border: `1px solid ${RISK_COLOR[selectedNode.riskLevel]}30`,
                          }}>
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-white">{selectedNode.label}</div>
                              <div className="font-mono text-xs text-gray-500 mt-0.5">{selectedNode.path}</div>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">✕</button>
                          </div>
                          <div className="mt-2 text-xs text-gray-400"><span className="text-gray-300 font-semibold">Relationship:</span> {selectedNode.relationship.replace("_", " ")}</div>
                          <div className="mt-1 text-xs text-gray-400"><span className="text-gray-300 font-semibold">Affected because:</span> {selectedNode.reason}</div>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLOR[selectedNode.riskLevel] }} />
                            <span className="text-xs font-semibold capitalize" style={{ color: RISK_COLOR[selectedNode.riskLevel] }}>
                              {selectedNode.riskLevel} risk
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Explanation */}
                  <div className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={13} className="text-amber-400" />
                      <span className="text-sm font-semibold text-white">How Will It Affect the System?</span>
                    </div>
                    <div className="font-mono text-xs mb-3" style={{ color: "#475569" }}>
                      CHANGE: {changeType.label} → <span style={{ color: "#a5b4fc" }}>{target.label}</span>
                    </div>
                    <div className="space-y-2.5">
                      {result.explanation.map((line, i) => (
                        <div key={i} className="flex items-start gap-2 animate-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                          <span className="font-mono text-xs text-violet-500 shrink-0 mt-0.5">{i + 1}.</span>
                          <span className="text-sm text-gray-400 leading-relaxed">{line}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: "1px solid #1e1e35" }}>
                      <div>
                        <span className="text-xs text-gray-600">Risk: </span>
                        <span className="text-xs font-bold" style={{ color: result.risk === "HIGH" ? "#f87171" : "#fbbf24" }}>{result.risk}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">Confidence: </span>
                        <span className="text-xs font-bold text-gray-300">{result.confidence}%</span>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle hint */}
            {simState === "idle" && (
              <div className="rounded-xl p-10 text-center" style={{ background: "#12121f", border: "1px dashed #1e1e35" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: "rgba(91,80,240,0.1)", border: "1px solid rgba(91,80,240,0.2)" }}>
                  <Zap size={22} className="text-violet-400" />
                </div>
                <div className="text-sm font-medium text-gray-400 mb-1">Select a target and change type</div>
                <div className="text-xs text-gray-600">Then click <span className="text-violet-400 font-semibold">Simulate Impact</span> to run analysis</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
