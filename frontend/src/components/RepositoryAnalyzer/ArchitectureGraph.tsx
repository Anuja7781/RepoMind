import { useMemo, useState } from "react"
import type { ArchitectureAnalysis, ArchitectureComponent, ArchitectureRelationship } from "@/services/analysisApi"

type ArchitectureNode = ArchitectureComponent & { dependencies: number; dependents: number; evidence: number; x: number; y: number }
type PositionedRelationship = ArchitectureRelationship & { id: string; sourceNode: ArchitectureNode; targetNode: ArchitectureNode }

const GROUP_ORDER = ["Presentation", "Application", "API", "Services", "ML / Processing", "Data", "Configuration", "Package", "Documentation", "Tests"]
const COLORS: Record<string, string> = { Presentation: "#8b5cf6", Application: "#06b6d4", API: "#a78bfa", Services: "#22c55e", "ML / Processing": "#f59e0b", Data: "#0ea5e9", Configuration: "#f472b6", Package: "#64748b", Documentation: "#c084fc", Tests: "#94a3b8" }
const NODE_WIDTH = 220
const NODE_HEIGHT = 100
const LEVEL_GAP = 72
const NODE_GAP = 28
const MAX_NODES_PER_ROW = 3

function componentColor(type: string) { return COLORS[type] ?? "#94a3b8" }

function buildNodes(analysis?: ArchitectureAnalysis | null): ArchitectureNode[] {
  const components = (analysis?.components ?? []).map(component => ({
    ...component,
    files: component.files ?? [],
    source_file_count: component.source_file_count ?? 0,
  }))
  const relationships = analysis?.relationships ?? []
  const incoming = new Map(components.map(component => [component.name, 0]))
  const outgoing = new Map(components.map(component => [component.name, 0]))
  const evidence = new Map(components.map(component => [component.name, 0]))
  relationships.forEach(relationship => {
    outgoing.set(relationship.source_component, (outgoing.get(relationship.source_component) ?? 0) + 1)
    incoming.set(relationship.target_component, (incoming.get(relationship.target_component) ?? 0) + 1)
    evidence.set(relationship.source_component, (evidence.get(relationship.source_component) ?? 0) + relationship.evidence_count)
    evidence.set(relationship.target_component, (evidence.get(relationship.target_component) ?? 0) + relationship.evidence_count)
  })
  const levels = new Map<string, number>()
  const remaining = new Map(incoming)
  const queue = components.filter(component => !remaining.get(component.name)).map(component => component.name)
  queue.forEach(name => levels.set(name, 0))
  while (queue.length) {
    const source = queue.shift()!
    relationships.filter(edge => edge.source_component === source).forEach(edge => {
      levels.set(edge.target_component, Math.max(levels.get(edge.target_component) ?? 0, (levels.get(source) ?? 0) + 1))
      remaining.set(edge.target_component, (remaining.get(edge.target_component) ?? 1) - 1)
      if (remaining.get(edge.target_component) === 0) queue.push(edge.target_component)
    })
  }
  components.forEach(component => {
    if (!levels.has(component.name)) levels.set(component.name, relationships.length ? 0 : Math.max(0, GROUP_ORDER.indexOf(component.component_type)) )
  })
  const rows = new Map<number, ArchitectureComponent[]>()
  components.forEach(component => rows.set(levels.get(component.name)!, [...(rows.get(levels.get(component.name)!) ?? []), component]))
  const levelY = new Map<number, number>()
  let nextY = 24
  ;[...rows.keys()].sort((left, right) => left - right).forEach(level => {
    levelY.set(level, nextY)
    nextY += Math.ceil((rows.get(level)?.length ?? 1) / MAX_NODES_PER_ROW) * (NODE_HEIGHT + LEVEL_GAP)
  })
  return components.map(component => {
    const row = rows.get(levels.get(component.name)!) ?? []
    const index = row.findIndex(item => item.name === component.name)
    return {
      ...component,
      dependencies: outgoing.get(component.name) ?? 0,
      dependents: incoming.get(component.name) ?? 0,
      evidence: evidence.get(component.name) ?? 0,
      x: 32 + (index % MAX_NODES_PER_ROW) * (NODE_WIDTH + NODE_GAP),
      y: (levelY.get(levels.get(component.name)!) ?? 24) + Math.floor(index / MAX_NODES_PER_ROW) * (NODE_HEIGHT + LEVEL_GAP),
    }
  })
}

function edgePath(source: ArchitectureNode, target: ArchitectureNode) {
  const startX = source.x + NODE_WIDTH / 2
  const startY = source.y + NODE_HEIGHT
  const endX = target.x + NODE_WIDTH / 2
  const endY = target.y
  if (Math.abs(startX - endX) < 3) return `M ${startX} ${startY} L ${endX} ${endY}`
  const bendY = startY + (endY - startY) / 2
  return `M ${startX} ${startY} C ${startX} ${bendY}, ${endX} ${bendY}, ${endX} ${endY}`
}

export default function ArchitectureGraph({ analysis }: { analysis?: ArchitectureAnalysis | null }) {
  const relationships = analysis?.relationships ?? []
  const evidenceSignals = analysis?.evidence ?? []
  const nodes = useMemo(() => buildNodes(analysis), [analysis])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<PositionedRelationship | null>(null)
  const selected = nodes.find(node => node.name === selectedName) ?? null
  const byName = new Map(nodes.map(node => [node.name, node]))
  const positionedEdges = relationships.flatMap((relationship, index) => {
    const sourceNode = byName.get(relationship.source_component)
    const targetNode = byName.get(relationship.target_component)
    return sourceNode && targetNode ? [{ ...relationship, id: `architecture-edge-${index}`, sourceNode, targetNode }] : []
  })
  const activeName = selectedName
  const maxX = Math.max(960, ...nodes.map(node => node.x + NODE_WIDTH + 32))
  const maxY = Math.max(390, ...nodes.map(node => node.y + NODE_HEIGHT + 32))
  const groups = [...new Set(nodes.map(node => node.component_type))]
  const connectedToSelected = (edge: PositionedRelationship) => !activeName || edge.source_component === activeName || edge.target_component === activeName

  if (!analysis) return <div className="rounded-xl border border-white/[0.06] bg-[#07070e] p-6 text-center text-sm text-gray-500">Architecture analysis unavailable.</div>

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-500">
      <span>Components: <strong className="text-gray-300">{nodes.length}</strong></span>
      <span>Relationships: <strong className="text-gray-300">{relationships.length}</strong></span>
      <span>Rendered connections: <strong className="text-gray-300">{positionedEdges.length}</strong></span>
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="relative overflow-auto rounded-xl border border-white/[0.06] bg-[#07070e]">
        {relationships.length === 0 && <div className="absolute left-4 right-4 top-4 z-10 rounded-lg border border-cyan-400/20 bg-[#0b1220]/95 px-4 py-3"><p className="text-xs font-medium text-cyan-200">Architecture components recovered, but no evidence-backed dependency relationships were found.</p><p className="mt-1 text-[11px] text-gray-500">No arrows are drawn because no reliable connection was recovered.</p></div>}
        <svg className="min-h-[390px] min-w-[720px] w-full" viewBox={`0 0 ${maxX} ${maxY}`} role="img" aria-label="Recovered software architecture diagram">
          <defs><pattern id="architecture-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="rgba(124,58,237,.055)" /></pattern><marker id="architecture-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4" orient="auto"><path d="M0 0L9 4L0 8Z" fill="#67e8f9" /></marker></defs>
          <rect width={maxX} height={maxY} fill="url(#architecture-grid)" />
          {positionedEdges.map(edge => { const active = connectedToSelected(edge); const midX = (edge.sourceNode.x + edge.targetNode.x) / 2 + NODE_WIDTH / 2; const midY = (edge.sourceNode.y + edge.targetNode.y) / 2 + NODE_HEIGHT / 2; return <g key={edge.id} onClick={() => setSelectedEdge(edge)} style={{ cursor: "pointer", opacity: active ? 1 : .16 }}><path d={edgePath(edge.sourceNode, edge.targetNode)} fill="none" stroke={selectedEdge?.id === edge.id ? "#fff" : "#67e8f9"} strokeWidth={selectedEdge?.id === edge.id ? 3 : 1.8} markerEnd="url(#architecture-arrow)" /><rect x={midX - 52} y={midY - 11} width="104" height="22" rx="5" fill="#07070e" stroke="rgba(103,232,249,.25)" /><text x={midX} y={midY + 4} textAnchor="middle" fill="#a5f3fc" fontSize="10" fontFamily="JetBrains Mono">{edge.label}</text></g> })}
          {nodes.map(node => { const color = componentColor(node.component_type); const active = selectedName === node.name; const dim = Boolean(activeName && activeName !== node.name && !positionedEdges.some(edge => (edge.source_component === activeName && edge.target_component === node.name) || (edge.target_component === activeName && edge.source_component === node.name))); return <g key={node.name} transform={`translate(${node.x} ${node.y})`} onClick={() => { setSelectedName(active ? null : node.name); setSelectedEdge(null) }} style={{ cursor: "pointer", opacity: dim ? .28 : 1 }}><rect width={NODE_WIDTH} height={NODE_HEIGHT} rx="8" fill="#0b0b14" stroke={active ? "#fff" : color} strokeWidth={active ? 2.5 : 1.5} /><rect width={NODE_WIDTH} height="5" rx="3" fill={color} /><text x="16" y="28" fill="#fff" fontSize="15" fontFamily="Inter" fontWeight="700">{node.name.length > 24 ? `${node.name.slice(0, 22)}...` : node.name}</text><text x="16" y="47" fill={color} fontSize="10" fontFamily="JetBrains Mono">{node.component_type}</text><text x="16" y="66" fill="#9ca3af" fontSize="10" fontFamily="JetBrains Mono">{node.representative_path ?? node.files[0] ?? "repository evidence"}</text><text x="16" y="84" fill="#6b7280" fontSize="10" fontFamily="JetBrains Mono">{node.files.length} files · {node.source_file_count} source · {node.dependencies} deps</text></g> })}
        </svg>
      </div>

      <aside className="rounded-xl border border-white/[0.06] bg-[#0b0b14] p-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-400">Architecture overview</div>
        <div className="mt-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] px-2 py-1 text-[10px] font-mono uppercase tracking-[0.12em] text-cyan-300">{analysis.architecture_basis}</div>
        <h2 className="mt-2 text-lg font-semibold text-white">{analysis.architecture_pattern}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs"><span className="text-gray-500">Confidence<strong className="block text-gray-200">{analysis.confidence}</strong></span><span className="text-gray-500">Entry point<strong className="block truncate text-gray-200">{analysis.entry_point ?? "Not recovered"}</strong></span><span className="text-gray-500">Primary language<strong className="block text-gray-200">{analysis.primary_language ?? "Unknown"}</strong></span><span className="text-gray-500">Evidence<strong className="block text-gray-200">{evidenceSignals.length} signals</strong></span></div>
        <p className="mt-4 text-xs leading-relaxed text-gray-400">{analysis.description}</p>
        <div className="mt-4 text-[10px] font-mono uppercase tracking-[0.14em] text-gray-500">Recovered regions</div>
        <div className="mt-2 flex flex-wrap gap-1.5">{groups.map(group => <span key={group} className="rounded border border-white/10 px-2 py-1 text-[10px]" style={{ color: componentColor(group) }}>{group}</span>)}</div>
      </aside>
    </div>

    {selectedEdge && <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Relationship evidence</h2><button onClick={() => setSelectedEdge(null)} className="text-xs text-gray-500">Close</button></div><div className="mt-3 grid gap-3 text-xs text-gray-400 sm:grid-cols-4"><span>Source<strong className="block text-gray-200">{selectedEdge.source_component}</strong></span><span>Target<strong className="block text-gray-200">{selectedEdge.target_component}</strong></span><span>Type<strong className="block text-gray-200">{selectedEdge.relationship_type}</strong></span><span>Confidence<strong className="block text-gray-200">{selectedEdge.confidence}</strong></span></div><p className="mt-3 text-xs text-gray-500">{selectedEdge.label} · {selectedEdge.evidence_count} evidence item(s)</p><div className="mt-2 text-xs text-gray-500">{(selectedEdge.supporting_files ?? []).join(" · ") || "No supporting file paths returned"}</div></div>}
    {selected && <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-white">Selected component: {selected.name}</h2><button onClick={() => setSelectedName(null)} className="text-xs text-gray-500">Close</button></div><div className="mt-3 grid gap-3 text-xs text-gray-400 sm:grid-cols-5"><span>Type<strong className="block text-gray-200">{selected.component_type}</strong></span><span>Files<strong className="block text-gray-200">{selected.files.length}</strong></span><span>Source files<strong className="block text-gray-200">{selected.source_file_count}</strong></span><span>Dependencies<strong className="block text-gray-200">{selected.dependencies}</strong></span><span>Dependents<strong className="block text-gray-200">{selected.dependents}</strong></span></div><div className="mt-3 text-xs text-gray-500">{selected.files.slice(0, 8).join(" · ")}</div></div>}
  </div>
}
