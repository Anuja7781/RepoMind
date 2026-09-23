import type { MetricsAnalysis } from "@/services/analysisApi"

const COLORS = ["#8b5cf6", "#06b6d4", "#34d399", "#fbbf24", "#f472b6", "#fb923c"]

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return <div className="rounded-xl p-4 bg-[#0e0e1a] border border-white/[0.06] text-center"><div className="font-mono text-2xl font-black" style={{ color }}>{value}</div><div className="text-xs text-white font-medium mt-0.5">{label}</div><div className="text-xs text-gray-600">{sub}</div></div>
}

function Distribution({ title, values }: { title: string; values: Record<string, number> }) {
  const total = Object.values(values).reduce((sum, value) => sum + value, 0)
  return <div><div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">{title}</div><div className="rounded-xl p-4 bg-[#0e0e1a] border border-white/[0.06]"><div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">{Object.entries(values).map(([label, value], index) => <div key={label} className="h-full rounded-sm" style={{ width: `${total ? value / total * 100 : 0}%`, backgroundColor: COLORS[index % COLORS.length] }} title={`${label}: ${value}`} />)}</div><div className="flex flex-wrap gap-4">{Object.entries(values).map(([label, value], index) => <div key={label} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="text-xs text-gray-400">{label}</span><span className="font-mono text-xs text-gray-600">{value}</span></div>)}</div></div></div>
}

export default function MetricsPanel({ metrics }: { metrics: MetricsAnalysis | null }) {
  if (!metrics) return <div className="rounded-xl border border-white/[0.06] bg-[#0e0e1a] p-6 text-center text-sm text-gray-500">Metrics are not available from the current analysis.</div>
  const graphCards = [["Entity Nodes", metrics.entity_nodes, "nodes"], ["Entity Relationships", metrics.entity_relationships, "edges"], ["Dependency Edges", metrics.dependency_edges, "edges"], ["Architecture Components", metrics.architecture_components, "components"]] as const
  const coverage = [["AST coverage", metrics.ast_coverage_percent, "%"], ["Dependency density", metrics.dependency_density, "edges/source file"], ["Average entity degree", metrics.average_entity_degree, "relationships/entity"], ["Architecture connectivity", metrics.architecture_connectivity, "relationships/component"]] as const
  return <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><MetricCard label="Repository Items" value={metrics.total_repository_items} sub="indexed" color="#8b5cf6" /><MetricCard label="Source Files" value={metrics.source_files} sub="downloaded" color="#06b6d4" /><MetricCard label="AST Files" value={metrics.ast_analyzed_files} sub="analyzed" color="#34d399" /><MetricCard label="Directories" value={metrics.directory_count} sub="detected" color="#fbbf24" /></div>
    <div><div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Repository Overview</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[["Stars", metrics.stars], ["Forks", metrics.forks], ["Size", `${metrics.repository_size} KB`], ["Branch", metrics.default_branch]].map(([label, value], index) => <MetricCard key={label} label={label as string} value={value as string | number} sub={`${metrics.owner}/${metrics.name}`} color={COLORS[index]} />)}</div></div>
    <Distribution title="Language Distribution (source files)" values={metrics.language_file_counts} /><Distribution title="File Types" values={metrics.file_type_counts} />
    <div><div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Code Structure</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[["Functions", metrics.total_functions], ["Classes", metrics.total_classes], ["Methods", metrics.total_methods], ["Imports", metrics.total_imports]].map(([label, value], index) => <MetricCard key={label} label={label as string} value={value as number} sub="from AST" color={COLORS[index]} />)}</div></div>
    <div><div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Graph Metrics</div><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{graphCards.map(([label, value, sub], index) => <MetricCard key={label} label={label} value={value} sub={sub} color={COLORS[index]} />)}</div></div>
    <div><div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-3">Analysis Coverage</div><div className="space-y-2 text-xs text-gray-400">{coverage.map(([label, value, unit]) => <div key={label} className="flex items-center justify-between rounded-lg bg-[#0e0e1a] border border-white/[0.06] px-4 py-3"><span>{label}</span><span className="font-mono text-violet-300">{value == null ? "Not available" : `${value}${unit === "%" ? "%" : ` ${unit}`}`}</span></div>)}</div></div>
  </div>
}
