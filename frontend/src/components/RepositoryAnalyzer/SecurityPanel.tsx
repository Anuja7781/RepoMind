import { useState } from "react"
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react"
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

export default function SecurityPanel({ analysis }: { analysis?: SecurityAnalysis | null }) {
  if (!analysis || analysis.status === "unavailable" || analysis.status === "failed") {
    return <div className="rounded-xl border border-white/[0.06] bg-[#0e0e1a] p-6 text-center text-sm text-gray-500">Security analysis unavailable. No findings are being inferred.</div>
  }
  if (analysis.status === "no_eligible_files") {
    return <div className="rounded-xl border border-white/[0.06] bg-[#0e0e1a] p-6 text-center text-sm text-gray-500">Security analysis completed with 0 eligible files. No findings were inferred.</div>
  }
  const findings = analysis?.findings ?? []
  const sorted = [...findings].sort((a, b) => SEV_CONFIG[a.severity].order - SEV_CONFIG[b.severity].order)
  const counts = {
    critical: analysis?.critical_count ?? 0,
    high: analysis?.high_count ?? 0,
    medium: analysis?.medium_count ?? 0,
    low: analysis?.low_count ?? 0,
  }
  const hasSecurityAnalysis = analysis != null

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
      <div className="text-xs text-gray-500">
        {hasSecurityAnalysis
          ? <>{analysis.summary} of {analysis.files_scanned} source files. {analysis.total_findings === 0 ? "No issues detected by the configured static rules." : `Configured static rules identified ${analysis.total_findings} potential security findings.`}</>
          : "Security analysis is unavailable for this analysis result. No findings are being inferred."}
      </div>

      {sorted.length === 0
        ? <div className="rounded-xl border border-white/[0.06] bg-[#0e0e1a] p-6 text-center text-sm text-gray-500">No issues detected by the configured static rules.</div>
        : <div className="space-y-2">{sorted.map(f => <FindingCard key={f.id} finding={f} />)}</div>}
    </div>
  )
}
