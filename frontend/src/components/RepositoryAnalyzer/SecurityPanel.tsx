import { useState } from "react"
import { ChevronDown, ChevronRight, ShieldAlert, Shield } from "lucide-react"
import { MODULE_RISKS } from "@/data/mockRepo"
import type { SecurityAnalysis, SecurityFinding } from "@/services/analysisApi"

const SEV_CONFIG = {
  critical: { color: "#ef4444", bg: "#ef444415", label: "Critical", order: 0 },
  high:     { color: "#f97316", bg: "#f9731615", label: "High",     order: 1 },
  medium:   { color: "#fbbf24", bg: "#fbbf2415", label: "Medium",   order: 2 },
  low:      { color: "#34d399", bg: "#34d39915", label: "Low",      order: 3 },
}

function FindingCard({ finding }: { finding: SecurityFinding }) {
  const [open, setOpen] = useState(false)
  const cfg = SEV_CONFIG[finding.severity]

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all duration-200"
      style={{ borderColor: open ? `${cfg.color}40` : "rgba(255,255,255,0.06)", backgroundColor: open ? cfg.bg : "rgba(14,14,26,0.6)" }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
          <ShieldAlert size={11} style={{ color: cfg.color }} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
            <span className="text-xs text-gray-500">{finding.category}</span>
          </div>
          <div className="text-sm text-gray-200 mt-0.5 truncate">{finding.title}</div>
        </div>
        <div className="flex-shrink-0 text-gray-600">
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="font-mono text-xs text-gray-500 flex items-center gap-1.5">
            <span className="text-violet-400/60">→</span>
            <span>{finding.file}</span>
            {finding.line != null && <span className="text-gray-600">:{finding.line}</span>}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">{finding.description}</p>
          <div className="rounded-lg p-3 border border-violet-500/15 bg-violet-500/5">
            <div className="text-xs text-violet-300/70 font-mono mb-1">Evidence</div>
            <p className="text-xs text-gray-400 leading-relaxed break-words">{finding.evidence}</p>
          </div>
          <div className="rounded-lg p-3 border border-green-500/15 bg-green-500/5">
            <div className="text-xs text-green-400/70 font-mono mb-1">Recommendation</div>
            <p className="text-xs text-gray-400 leading-relaxed">{finding.recommendation}</p>
          </div>
          <div className="text-xs text-gray-600">Confidence: <span className="text-gray-400 capitalize">{finding.confidence}</span></div>
        </div>
      )}
    </div>
  )
}

export default function SecurityPanel({ analysis }: { analysis: SecurityAnalysis }) {
  const [tab, setTab] = useState<"findings" | "risk">("findings")
  const sorted = [...analysis.findings].sort((a, b) => SEV_CONFIG[a.severity].order - SEV_CONFIG[b.severity].order)
  const counts = { critical: analysis.critical_count, high: analysis.high_count, medium: analysis.medium_count, low: analysis.low_count }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(SEV_CONFIG).map(([k, v]) => (
          <div key={k} className="rounded-xl p-3 text-center" style={{ backgroundColor: v.bg, border: `1px solid ${v.color}25` }}>
            <div className="font-mono text-xl font-bold" style={{ color: v.color }}>{counts[k as keyof typeof counts]}</div>
            <div className="text-xs text-gray-500 mt-0.5">{v.label}</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500">{analysis.summary} of {analysis.files_scanned} source files. {analysis.total_findings === 0 ? "No potential issues detected by the current static rules." : `Static analysis identified ${analysis.total_findings} potential security findings.`}</div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-lg border border-white/[0.07] w-fit">
        {(["findings", "risk"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${tab === t ? "bg-violet-600/30 text-violet-300" : "text-gray-500 hover:text-gray-300"}`}>
            {t === "findings" ? "Security Findings" : "Bug Risk Modules"}
          </button>
        ))}
      </div>

      {tab === "findings" ? (
        sorted.length === 0
          ? <div className="rounded-xl border border-white/[0.06] bg-[#0e0e1a] p-6 text-center text-sm text-gray-500">No potential issues detected by the current static rules.</div>
          : <div className="space-y-2">{sorted.map(f => <FindingCard key={f.id} finding={f} />)}</div>
      ) : (
        <div className="space-y-2">
          {MODULE_RISKS.map(mod => (
            <div key={mod.id} className="rounded-xl p-4 bg-[#0e0e1a] border border-white/[0.06] hover:border-violet-500/20 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: mod.risk === "high" ? "#ef4444" : mod.risk === "medium" ? "#fbbf24" : "#34d399" }} />
                    <span className="text-sm font-medium text-white">{mod.name}</span>
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{
                      backgroundColor: mod.risk === "high" ? "#ef444415" : mod.risk === "medium" ? "#fbbf2415" : "#34d39915",
                      color: mod.risk === "high" ? "#ef4444" : mod.risk === "medium" ? "#fbbf24" : "#34d399",
                    }}>{mod.risk} risk</span>
                  </div>
                  <div className="font-mono text-xs text-gray-600 mt-0.5 truncate max-w-xs">{mod.path}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg font-bold" style={{ color: mod.risk === "high" ? "#ef4444" : mod.risk === "medium" ? "#fbbf24" : "#34d399" }}>{mod.riskScore}</div>
                  <div className="text-xs text-gray-600">risk score</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[["Complexity", mod.complexity, "#8b5cf6"], ["Coupling", mod.coupling, "#06b6d4"], ["Coverage", `${mod.coverage}%`, "#34d399"], ["Churn", mod.churn, "#fbbf24"]].map(([l, v, c]) => (
                  <div key={l as string} className="text-center">
                    <div className="font-mono text-xs font-semibold" style={{ color: c as string }}>{v}</div>
                    <div className="text-xs text-gray-600">{l}</div>
                  </div>
                ))}
              </div>
              {/* Risk bar */}
              <div className="mt-2 h-1 bg-white/10 rounded-full">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${mod.riskScore}%`,
                  backgroundColor: mod.risk === "high" ? "#ef4444" : mod.risk === "medium" ? "#fbbf24" : "#34d399",
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
