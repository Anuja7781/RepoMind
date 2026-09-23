import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertTriangle, XCircle, GitMerge, ChevronDown } from "lucide-react"
import { ARCHITECTURE_DRIFT, type DriftViolation } from "@/data/impactData"

const drift = ARCHITECTURE_DRIFT

const SEV: Record<string, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", label: "Critical" },
  high:     { color: "#fb923c", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.25)",  label: "High"     },
  medium:   { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)",  label: "Medium"   },
}

// ─── Architecture Stack ───────────────────────────────────────────────────────
function ArchStack({ title, layers, violations, side }: {
  title: string
  layers: { label: string; status: "match" | "warning" | "violation" | "extra" }[]
  violations?: string[]
  side: "left" | "right"
}) {
  const STATUS: Record<string, { color: string; bg: string; border: string }> = {
    match:     { color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.25)"  },
    warning:   { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)"  },
    violation: { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
    extra:     { color: "#fbbf24", bg: "rgba(251,191,36,0.07)",  border: "rgba(251,191,36,0.22)"  },
  }
  const labelColor = side === "left" ? "#818cf8" : "#fbbf24"

  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: labelColor }}>{title}</div>
      <div className="space-y-1.5">
        {layers.map((layer, i) => {
          const s = STATUS[layer.status]
          return (
            <div key={layer.label}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all"
                style={{ backgroundColor: s.bg, borderColor: s.border, color: s.color }}>
                {layer.status === "match"     && <CheckCircle2 size={12} />}
                {layer.status === "warning"   && <AlertTriangle size={12} />}
                {layer.status === "violation" && <XCircle size={12} />}
                {layer.status === "extra"     && <AlertTriangle size={12} />}
                <span className="font-mono text-xs">{layer.label}</span>
                {layer.status !== "match" && (
                  <span className="ml-auto text-xs opacity-70 capitalize">{layer.status}</span>
                )}
              </div>
              {i < layers.length - 1 && (
                <div className="flex justify-center my-0.5">
                  <div className="w-px h-3" style={{ background: "#2a2a45" }} />
                </div>
              )}
            </div>
          )
        })}
        {violations?.map(v => (
          <div key={v} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs mt-2"
            style={{ background: "rgba(248,113,113,0.07)", borderColor: "rgba(248,113,113,0.22)", color: "#f87171" }}>
            <XCircle size={11} className="shrink-0" />
            <span className="font-mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Violation Card ────────────────────────────────────────────────────────────
function ViolationCard({ v }: { v: DriftViolation }) {
  const [open, setOpen] = useState(false)
  const cfg = SEV[v.severity]
  return (
    <div className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: open ? cfg.border : "#1e1e35", background: open ? cfg.bg : "#12121f" }}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: "transparent" }} onClick={() => setOpen(o => !o)}>
        <span className="shrink-0 px-2 py-0.5 rounded text-xs font-mono font-bold border"
          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>{cfg.label}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm">
            <span className="font-mono" style={{ color: "#a5b4fc" }}>{v.from}</span>
            <span className="mx-1.5 text-gray-600">→</span>
            <span className="font-mono text-gray-400">{v.to}</span>
          </span>
        </div>
        <ChevronDown size={13} className={`text-gray-600 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 animate-expand-in" style={{ borderTop: "1px solid #1e1e35" }}>
          <p className="text-sm text-gray-400 leading-relaxed pt-3">{v.description}</p>
          <div className="rounded-lg p-3" style={{ background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <div className="text-xs font-semibold mb-1 text-emerald-400">Recommendation</div>
            <p className="text-xs text-gray-400 leading-relaxed">{v.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function DriftTimeline({ yearIndex, onChange }: { yearIndex: number; onChange: (i: number) => void }) {
  const snap = drift.timeline[yearIndex]
  return (
    <div className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
      <div className="text-sm font-semibold text-white mb-4">Architecture Drift Timeline</div>
      <div className="flex items-center gap-4 mb-4">
        <span className="text-xs font-mono" style={{ color: "#475569" }}>2023</span>
        <input type="range" min={0} max={drift.timeline.length - 1} value={yearIndex}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #5b50f0 ${(yearIndex / (drift.timeline.length - 1)) * 100}%, #2a2a45 0%)` }} />
        <span className="text-xs font-mono" style={{ color: "#475569" }}>2026</span>
      </div>
      <div className="flex justify-between mb-4">
        {drift.timeline.map((t, i) => (
          <button key={t.year} onClick={() => onChange(i)}
            className="text-xs font-mono px-2 py-1 rounded transition-all"
            style={i === yearIndex
              ? { background: "#5b50f0", color: "white" }
              : { color: "#475569" }}>
            {t.year}
          </button>
        ))}
      </div>
      <motion.div key={yearIndex} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-lg p-3" style={{ background: "rgba(91,80,240,0.08)", border: "1px solid rgba(91,80,240,0.2)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono font-semibold text-violet-400">{snap.year}</span>
          <div className="flex gap-4">
            <span className="text-xs text-gray-500">Conformance: <span className="font-bold text-violet-400">{snap.conformance}%</span></span>
            <span className="text-xs text-gray-500">Violations: <span className="font-bold text-red-400">{snap.violations}</span></span>
          </div>
        </div>
        <p className="text-xs text-gray-500">{snap.description}</p>
      </motion.div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 mt-4" style={{ height: 64 }}>
        {drift.timeline.map((t, i) => (
          <div key={t.year} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full rounded-sm transition-all duration-300"
              style={{ height: `${(100 - t.violations * 12) * 0.52}px`, background: i === yearIndex ? "#5b50f0" : "#2a2a45" }} />
            <div className="w-full rounded-sm" style={{ height: `${t.violations * 8}px`, background: "rgba(248,113,113,0.5)" }} />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "#5b50f0" }} /><span className="text-xs text-gray-600">Conformance</span></div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm" style={{ background: "rgba(248,113,113,0.5)" }} /><span className="text-xs text-gray-600">Violations</span></div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ArchitectureDrift() {
  const [yearIndex, setYearIndex] = useState(3)
  const snap = drift.timeline[yearIndex]

  const EXPECTED = [
    { label: "Frontend",          status: "match"     as const },
    { label: "API Layer",         status: "match"     as const },
    { label: "Service Layer",     status: "match"     as const },
    { label: "Repository Layer",  status: "match"     as const },
    { label: "Database",          status: "match"     as const },
  ]
  const IMPLEMENTED = [
    { label: "Frontend",          status: "match"     as const },
    { label: "API Layer",         status: "match"     as const },
    { label: "Service Layer",     status: "match"     as const },
    { label: "Repository Layer",  status: "match"     as const },
    { label: "Database",          status: "match"     as const },
    { label: "LegacyUtils",       status: "extra"     as const },
    { label: "ExternalAPI",       status: "warning"   as const },
  ]

  const yearViolations = snap.violations > 0
    ? ["PaymentService → Database (violation)"]
    : []

  return (
    <div className="min-h-screen" style={{ background: "#0d0d18" }}>
      {/* Header */}
      <div style={{ background: "#12121f", borderBottom: "1px solid #1e1e35" }}>
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <GitMerge size={16} className="text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Architecture Drift</h1>
          </div>
          <p className="text-gray-500 text-sm ml-11 font-mono">// Compare what the architecture says vs. what the code implements</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Score row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Architecture Conformance", value: `${drift.conformance}%`, color: "#fbbf24" },
            { label: "Expected Components",      value: drift.expectedComponents, color: "#818cf8" },
            { label: "Implemented",              value: drift.implementedComponents, color: "#06b6d4" },
            { label: "Violations",               value: drift.violations.length, color: "#f87171" },
            { label: "Drift Level",              value: drift.driftLevel, color: "#fbbf24" },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4 text-center"
              style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
              <div className="font-mono font-black text-2xl animate-score-reveal" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5 leading-tight" style={{ color: "#475569" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Architecture comparison */}
        <div className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
          <div className="text-sm font-semibold text-white mb-4">Architecture Comparison</div>
          <div className="flex gap-4 flex-col sm:flex-row">
            <ArchStack title="Documented Architecture" side="left" layers={EXPECTED} />

            <div className="flex flex-col items-center justify-center gap-3 px-3 shrink-0">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(52,211,153,0.3)", border: "1px solid rgba(52,211,153,0.4)" }} /><span className="text-xs" style={{ color: "#475569" }}>Match</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(251,191,36,0.2)", border: "1px solid rgba(251,191,36,0.3)" }} /><span className="text-xs" style={{ color: "#475569" }}>Warning</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(248,113,113,0.2)", border: "1px solid rgba(248,113,113,0.3)" }} /><span className="text-xs" style={{ color: "#475569" }}>Violation</span></div>
              <div className="w-px flex-1 my-2" style={{ background: "#1e1e35" }} />
              <span className="text-xs font-mono" style={{ color: "#2a2a45" }}>vs</span>
              <div className="w-px flex-1 my-2" style={{ background: "#1e1e35" }} />
            </div>

            <ArchStack title="Implemented Architecture" side="right" layers={IMPLEMENTED} violations={yearViolations} />
          </div>

          {snap.violations > 0 && (
            <div className="mt-4 pt-4 animate-arch-shift" style={{ borderTop: "1px solid #1e1e35" }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#f87171" }}>
                Architecture Violations in {snap.year}
              </div>
              <div className="space-y-1.5">
                {drift.extraEdges.slice(0, snap.violations).map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border"
                    style={e.type === "violation"
                      ? { background: "rgba(248,113,113,0.07)", borderColor: "rgba(248,113,113,0.22)", color: "#f87171" }
                      : { background: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.22)", color: "#fbbf24" }}>
                    {e.type === "violation" ? <XCircle size={11} /> : <AlertTriangle size={11} />}
                    <span className="font-mono font-semibold">{e.from}</span>
                    <span style={{ color: "#475569" }}>→</span>
                    <span className="font-mono">{e.to}</span>
                    <span className="opacity-70 ml-1">{e.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Timeline */}
        <DriftTimeline yearIndex={yearIndex} onChange={setYearIndex} />

        {/* Violations */}
        <div className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">Architecture Violations ({drift.violations.length})</div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full"
              style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
              {drift.driftLevel} DRIFT
            </span>
          </div>
          <div className="space-y-2">
            {drift.violations.map(v => <ViolationCard key={v.id} v={v} />)}
          </div>
        </div>

        {/* Agent pipeline */}
        <div className="rounded-xl p-5" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
          <div className="text-sm font-semibold text-white mb-4">Agent Pipeline</div>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            {[
              { label: "Architecture Recovery Agent", input: "Source code + deps + docs",   output: "Implemented Architecture", color: "#818cf8" },
              { label: "Drift Comparison Engine",     input: "Expected vs Implemented",     output: "Drift analysis + violations", color: "#06b6d4" },
              { label: "Recommendation Agent",        input: "Violations + arch model",     output: "Suggested improvements",   color: "#34d399" },
            ].map((agent, i) => (
              <div key={agent.label} className="flex-1 flex flex-col sm:flex-row items-start gap-2">
                <div className="flex-1 rounded-xl border p-3"
                  style={{ borderColor: `${agent.color}25`, background: `${agent.color}07` }}>
                  <div className="text-xs font-semibold mb-1.5" style={{ color: agent.color }}>{agent.label}</div>
                  <div className="text-xs mb-1" style={{ color: "#475569" }}>Input: {agent.input}</div>
                  <div className="text-xs text-gray-500">→ {agent.output}</div>
                </div>
                {i < 2 && <div className="hidden sm:block text-gray-700 font-mono mt-6">→</div>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
