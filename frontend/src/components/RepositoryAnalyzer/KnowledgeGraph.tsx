import { useMemo, useRef, useState } from "react"
import type { EntityGraph, GraphEdge, GraphNode } from "@/services/analysisApi"

type EntityType = "module" | "class" | "function" | "interface" | "file" | "method"
type Depth = "1" | "2" | "all"
interface EntityView extends GraphNode { type: EntityType; degree: number; x: number; y: number }
interface EdgeView extends GraphEdge { label: string }

const TYPE_LABELS: Record<string, string> = { class: "Classes", module: "Modules", function: "Functions", interface: "Interfaces", file: "Files", method: "Methods" }
const TYPE_COLORS: Record<string, string> = { file: "#06b6d4", module: "#8b5cf6", class: "#f59e0b", function: "#22c55e", method: "#a78bfa", interface: "#f472b6" }
const EDGE_COLORS: Record<string, string> = { contains: "#64748b", defines: "#22c55e", imports: "#8b5cf6", has_method: "#f59e0b", depends_on: "#06b6d4" }

function normalize(graph: EntityGraph): { nodes: EntityView[]; edges: EdgeView[] } {
  const degree = new Map<string, number>()
  graph.edges.forEach(edge => { degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1); degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1) })
  return {
    nodes: graph.nodes.map(node => ({ ...node, type: (TYPE_LABELS[node.node_type] ? node.node_type : "module") as EntityType, degree: degree.get(node.id) ?? 0, x: 0, y: 0 })),
    edges: graph.edges.map(edge => ({ ...edge, label: edge.relationship })),
  }
}

function neighborhood(nodes: EntityView[], edges: EdgeView[], selectedId: string | null, depth: Depth) {
  if (!selectedId || depth === "all") return new Set(nodes.map(node => node.id))
  const visible = new Set([selectedId])
  let frontier = new Set([selectedId])
  for (let hop = 0; hop < Number(depth); hop += 1) {
    const next = new Set<string>()
    edges.forEach(edge => { if (frontier.has(edge.source)) next.add(edge.target); if (frontier.has(edge.target)) next.add(edge.source) })
    next.forEach(id => visible.add(id)); frontier = next
  }
  return visible
}

const STRUCTURAL_RELATIONSHIPS = new Set(["contains", "defines", "has_method"])

function relationshipPriority(relationship: string) {
  if (relationship === "calls") return 0
  if (relationship === "imports") return 1
  if (relationship === "uses") return 2
  if (relationship === "depends_on") return 3
  if (STRUCTURAL_RELATIONSHIPS.has(relationship)) return 5
  return 4
}

function connectedNeighborhood(nodes: EntityView[], edges: EdgeView[], root: string, depth: Depth, limit = 16) {
  if (depth === "all") return new Set(nodes.map(node => node.id))
  const selected = new Set([root])
  let frontier = new Set([root])
  for (let hop = 0; hop < Number(depth) && selected.size < limit; hop += 1) {
    const candidates = edges
      .filter(edge => frontier.has(edge.source) || frontier.has(edge.target))
      .map(edge => ({ edge, next: frontier.has(edge.source) ? edge.target : edge.source }))
      .filter(candidate => !selected.has(candidate.next))
      .sort((left, right) => relationshipPriority(left.edge.relationship) - relationshipPriority(right.edge.relationship) || (nodes.find(node => node.id === right.next)?.degree ?? 0) - (nodes.find(node => node.id === left.next)?.degree ?? 0))
    const nextFrontier = new Set<string>()
    candidates.forEach(candidate => {
      if (selected.size >= limit) return
      selected.add(candidate.next)
      nextFrontier.add(candidate.next)
    })
    frontier = nextFrontier
  }
  return selected
}

function layout(nodes: EntityView[], edges: EdgeView[], preferredRoot: string | null) {
  const root = preferredRoot ?? nodes.find(node => node.type === "module")?.id ?? nodes.find(node => node.type === "file")?.id ?? nodes[0]?.id
  if (!root) return []
  const neighbors = new Map<string, string[]>()
  edges.forEach(edge => { neighbors.set(edge.source, [...(neighbors.get(edge.source) ?? []), edge.target]); neighbors.set(edge.target, [...(neighbors.get(edge.target) ?? []), edge.source]) })
  const level = new Map<string, number>([[root, 0]]); const queue = [root]
  while (queue.length) { const current = queue.shift()!; (neighbors.get(current) ?? []).sort().forEach(next => { if (!level.has(next)) { level.set(next, (level.get(current) ?? 0) + 1); queue.push(next) } }) }
  const rows = new Map<number, EntityView[]>()
  nodes.forEach(node => { const row = level.get(node.id) ?? 0; rows.set(row, [...(rows.get(row) ?? []), node]) })
  return nodes.map(node => {
    const row = rows.get(level.get(node.id) ?? 0) ?? []
    const index = row.indexOf(node)
    return { ...node, x: 110 + (index % 4) * 180, y: 60 + (level.get(node.id) ?? 0) * 105 + Math.floor(index / 4) * 62 }
  })
}

function locationFor(node: EntityView) {
  const parts = node.id.split(":")
  if (node.type === "file" || node.type === "module") return parts.slice(1).join(":")
  return parts.length > 3 ? `${parts[1]}:${parts[parts.length - 1]}` : parts.slice(1).join(":")
}

export default function KnowledgeGraph({ graph }: { graph: EntityGraph }) {
  const { nodes, edges } = useMemo(() => normalize(graph), [graph])
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [depth, setDepth] = useState<Depth>("1")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.9)
  const [pan, setPan] = useState({ x: 20, y: 20 })
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })
  const availableTypes = [...new Set(nodes.map(node => node.type))]
  const selected = nodes.find(node => node.id === selectedId) ?? null
  const filterMatches = nodes.filter(node => (typeFilter === "all" || node.type === typeFilter) && node.label.toLowerCase().includes(query.trim().toLowerCase()))
  const initialRoot = filterMatches.find(node => node.type === "module") ?? filterMatches.find(node => node.type === "file") ?? filterMatches[0] ?? nodes.find(node => node.type === "module") ?? nodes.find(node => node.type === "file") ?? nodes[0] ?? null
  const initialIds = useMemo(() => initialRoot ? connectedNeighborhood(nodes, edges, initialRoot.id, "1") : new Set<string>(), [nodes, edges, initialRoot])
  const selectedIds = selectedId ? connectedNeighborhood(nodes, edges, selectedId, depth) : new Set<string>()
  const searchIds = query.trim() ? new Set(filterMatches.flatMap(node => [...connectedNeighborhood(nodes, edges, node.id, depth)])) : null
  const visibleNodes = nodes.filter(node => {
    if (typeFilter !== "all" && node.type !== typeFilter) return false
    if (selectedId) return selectedIds.has(node.id)
    if (searchIds) return searchIds.has(node.id)
    return initialIds.has(node.id)
  })
  const visibleEdges = edges.filter(edge => visibleNodes.some(node => node.id === edge.source) && visibleNodes.some(node => node.id === edge.target))
  const laidOut = layout(visibleNodes, visibleEdges, selectedId)
  const visibleIds = new Set(laidOut.map(node => node.id))
  const renderedEdges = visibleEdges.filter(edge => visibleIds.has(edge.source) && visibleIds.has(edge.target))
  const activeId = hoveredId ?? selectedId
  const connectedIds = activeId ? renderedEdges.flatMap(edge => edge.source === activeId ? [edge.target] : edge.target === activeId ? [edge.source] : []) : []
  const related = selectedId ? edges.filter(edge => edge.source === selectedId || edge.target === selectedId) : []

  if (nodes.length === 0) return <div className="relative flex h-[460px] items-center justify-center rounded-xl border border-white/[0.06] bg-[#07070e] text-sm text-gray-600">No knowledge graph entities available.</div>

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-500"><span className="text-sm text-gray-300">Knowledge Graph</span><span>{nodes.length} entities</span><span>{edges.length} relationships</span><span>Showing {laidOut.length} entities</span></div>
    <div className="flex flex-wrap items-center gap-2"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search entities..." className="min-w-[190px] flex-1 rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs text-gray-300 outline-none placeholder:text-gray-600" /><button onClick={() => setTypeFilter("all")} className={`rounded-md border px-2.5 py-2 text-xs ${typeFilter === "all" ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/[0.07] text-gray-500"}`}>All</button>{availableTypes.map(type => <button key={type} onClick={() => setTypeFilter(type)} className={`rounded-md border px-2.5 py-2 text-xs ${typeFilter === type ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-white/[0.07] text-gray-500"}`}>{TYPE_LABELS[type]}</button>)}<span className="ml-1 text-xs text-gray-600">Neighborhood:</span>{(["1", "2", "all"] as const).map(value => <button key={value} onClick={() => setDepth(value)} className={`rounded-md border px-2.5 py-2 text-xs ${depth === value ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/[0.07] text-gray-500"}`}>{value === "all" ? "All" : `${value} hop`}</button>)}</div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
      <div className="relative h-[520px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#07070e]"><div className="absolute right-3 top-3 z-10 flex gap-1.5"><button onClick={() => setZoom(value => Math.min(2.5, value + .15))} className="h-7 w-7 rounded-md border border-white/[0.1] bg-white/[0.06] text-gray-400">+</button><button onClick={() => setZoom(value => Math.max(.35, value - .15))} className="h-7 w-7 rounded-md border border-white/[0.1] bg-white/[0.06] text-gray-400">−</button><button onClick={() => { setPan({ x: 20, y: 20 }); setZoom(.9) }} className="h-7 rounded-md border border-white/[0.1] bg-white/[0.06] px-2 text-xs text-gray-400">Reset</button></div><svg className="h-full w-full cursor-grab active:cursor-grabbing" onMouseDown={event => { dragging.current = true; last.current = { x: event.clientX, y: event.clientY } }} onMouseMove={event => { if (!dragging.current) return; setPan(value => ({ x: value.x + event.clientX - last.current.x, y: value.y + event.clientY - last.current.y })); last.current = { x: event.clientX, y: event.clientY } }} onMouseUp={() => { dragging.current = false }} onMouseLeave={() => { dragging.current = false }} onWheel={event => { event.preventDefault(); setZoom(value => Math.max(.35, Math.min(2.5, value - event.deltaY * .001))) }}><defs><marker id="knowledge-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#64748b" /></marker><pattern id="knowledge-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0 L0 0 0 24" fill="none" stroke="rgba(124,58,237,.04)" /></pattern></defs><g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}><rect x="-300" y="-200" width="1600" height="1000" fill="url(#knowledge-grid)" />{renderedEdges.map((edge, index) => { const source = laidOut.find(node => node.id === edge.source)!; const target = laidOut.find(node => node.id === edge.target)!; const active = activeId === edge.source || activeId === edge.target; const color = EDGE_COLORS[edge.relationship] ?? "#64748b"; const midpoint = (source.x + target.x) / 2; return <g key={`${edge.source}-${edge.target}-${index}`}><path d={`M${source.x + 58},${source.y + 22} Q${midpoint},${(source.y + target.y) / 2 - 10} ${target.x - 58},${target.y + 22}`} fill="none" stroke={active ? color : "rgba(148,163,184,.32)"} strokeWidth={active ? 2 : 1.1} markerEnd="url(#knowledge-arrow)" /><text x={midpoint} y={(source.y + target.y) / 2 - 7} textAnchor="middle" fill={color} fontSize="8" opacity={active ? .95 : .35}>{edge.label}</text></g> })}{laidOut.map(node => { const active = node.id === activeId; const connected = connectedIds.includes(node.id); const dim = Boolean(activeId && !active && !connected); const color = TYPE_COLORS[node.type] ?? "#94a3b8"; return <g key={node.id} data-entity-node="true" transform={`translate(${node.x},${node.y})`} onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(null)} onClick={() => setSelectedId(current => current === node.id ? null : node.id)} style={{ cursor: "pointer", opacity: dim ? .22 : 1 }}><rect x="-58" y="0" width="116" height="44" rx="5" fill="#0c0c17" stroke={color} strokeWidth={active ? 2 : 1} /><text textAnchor="middle" y="16" fill="white" fontSize="9" fontFamily="JetBrains Mono">{node.label.length > 18 ? `${node.label.slice(0, 16)}...` : node.label}</text><text textAnchor="middle" y="33" fill={color} fontSize="8">{node.type} · {node.degree}</text></g> })}</g></svg></div>
      <aside className="rounded-xl border border-white/[0.06] bg-[#0b0b14] p-4">{selected ? <><div className="text-[10px] font-mono uppercase tracking-[0.16em]" style={{ color: TYPE_COLORS[selected.type] }}>{selected.type}</div><h2 className="mt-2 break-words text-lg font-semibold text-white">{selected.label}</h2><div className="mt-3 space-y-2 text-xs text-gray-500"><div>Location<strong className="block break-words text-gray-200">{locationFor(selected)}</strong></div><div>Relationships<strong className="block text-gray-200">{related.length}</strong></div><div>Connected entities<strong className="block text-gray-200">{connectedIds.length}</strong></div></div><div className="mt-4 text-[10px] font-mono uppercase tracking-[0.14em] text-gray-500">Evidence relationships</div><div className="mt-2 space-y-2">{related.slice(0, 10).map((edge, index) => <div key={`${edge.source}-${edge.target}-${index}`} className="border-l border-white/10 pl-2 text-xs text-gray-400"><span style={{ color: EDGE_COLORS[edge.relationship] ?? "#94a3b8" }}>{edge.label}</span><br />{edge.source === selected.id ? edge.target : edge.source}</div>)}</div></> : <><div className="text-[10px] font-mono uppercase tracking-[0.16em] text-cyan-400">Semantic graph</div><h2 className="mt-2 text-lg font-semibold text-white">Repository entities</h2><p className="mt-3 text-xs leading-relaxed text-gray-500">Select a file, module, class, function, or method to inspect its local neighborhood and evidence-backed relationships.</p><div className="mt-4 space-y-2 text-xs text-gray-500">{availableTypes.map(type => <div key={type} className="flex items-center justify-between"><span style={{ color: TYPE_COLORS[type] }}>{TYPE_LABELS[type]}</span><span>{nodes.filter(node => node.type === type).length}</span></div>)}</div></>}</aside>
    </div>
  </div>
}
