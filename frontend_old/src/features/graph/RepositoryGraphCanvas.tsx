import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
  type Edge,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { DependencyGraph, GraphNode } from '@/types';

const NODE_COLORS: Record<string, string> = {
  file: '#8b5cf6',
  module: '#38bdf8',
  class: '#22c55e',
  function: '#f59e0b',
  method: '#f472b6',
};

const TYPE_ORDER = ['file', 'module', 'class', 'function', 'method'];

function normalizeGraph(graph: DependencyGraph, mode: string) {
  const nodeFilter = mode === 'all' ? () => true : (node: GraphNode) => node.node_type === mode;
  const filteredNodes = graph.nodes.filter(nodeFilter);
  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));
  const filteredEdges = graph.edges.filter(
    (edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
  );

  return { filteredNodes, filteredEdges };
}

function layoutGraph(nodes: GraphNode[]) {
  const laneMap: Record<string, { x: number; y: number }[]> = {};

  nodes.forEach((node) => {
    const laneIndex = TYPE_ORDER.indexOf(node.node_type) >= 0 ? node.node_type : 'file';
    const lane = laneMap[laneIndex] ?? [];
    lane.push({ x: 0, y: 0 });
    laneMap[laneIndex] = lane;
  });

  const laneValues = Object.entries(laneMap).map(([lane, items]) => ({ lane, items }));
  const laneOffset: Record<string, number> = {};

  laneValues.forEach(({ lane }, laneIndex) => {
    laneOffset[lane] = laneIndex * 260;
  });

  const positioned = nodes.map((node, index) => {
    const lane = TYPE_ORDER.includes(node.node_type) ? node.node_type : 'file';
    const laneItems = laneMap[lane] ?? [];
    const lanePosition = laneItems.indexOf(laneItems.find((_, itemIndex) => itemIndex === index) ?? { x: 0, y: 0 });
    const x = 140 + laneOffset[lane] + (lanePosition % 2) * 150;
    const y = 90 + Math.floor((lanePosition || 0) / 2) * 140 + (index % 2) * 30;

    return {
      ...node,
      position: { x, y },
    };
  });

  return positioned;
}

const graphModeLabels: Record<string, string> = {
  all: 'All',
  file: 'Files',
  module: 'Modules',
  class: 'Classes',
  function: 'Functions',
  method: 'Methods',
};

export function RepositoryGraphCanvas({
  graph,
  mode,
  selectedNodeId,
  onNodeSelect,
  searchQuery,
}: {
  graph: DependencyGraph;
  mode: string;
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  searchQuery?: string;
}) {
  const { filteredNodes, filteredEdges } = useMemo(() => {
    const normalized = normalizeGraph(graph, mode);
    const search = (searchQuery ?? '').trim().toLowerCase();

    const nodes = search
      ? normalized.filteredNodes.filter((node) => node.label.toLowerCase().includes(search))
      : normalized.filteredNodes;

    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = normalized.filteredEdges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
    );

    const positioned = layoutGraph(nodes);

    return {
      filteredNodes: positioned,
      filteredEdges: edges,
    };
  }, [graph, mode, searchQuery]);

  const flowNodes: Node[] = useMemo(
    () =>
      filteredNodes.map((node) => ({
        id: node.id,
        data: { label: node.label, type: node.node_type },
        position: node.position,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          border: selectedNodeId === node.id ? '2px solid rgba(140, 92, 246, 1)' : '1px solid rgba(148, 163, 184, 0.24)',
          borderRadius: 16,
          background: selectedNodeId === node.id ? 'rgba(91, 33, 182, 0.9)' : 'rgba(15, 23, 42, 0.9)',
          boxShadow: selectedNodeId === node.id ? '0 0 0 1px rgba(168, 85, 247, 0.45), 0 0 30px rgba(139, 92, 246, 0.3)' : '0 0 0 1px rgba(148, 163, 184, 0.1)',
          width: 160,
          padding: '10px 12px',
          color: '#e2e8f0',
          fontSize: 12,
        },
        className: 'repo-flow-node',
      })),
    [filteredNodes, selectedNodeId],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      filteredEdges.map((edge, index) => ({
        id: `${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.relationship,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: selectedNodeId ? '#7dd3fc' : '#94a3b8',
        },
        animated: selectedNodeId === edge.source || selectedNodeId === edge.target,
        style: {
          stroke: selectedNodeId ? '#7dd3fc' : '#475569',
          strokeWidth: selectedNodeId === edge.source || selectedNodeId === edge.target ? 2.5 : 1.5,
          opacity: selectedNodeId ? 0.9 : 0.65,
        },
        labelStyle: { fill: '#cbd5e1', fontSize: 10 },
      })),
    [filteredEdges, selectedNodeId],
  );

  return (
    <div className="h-[560px] w-full overflow-hidden rounded-[22px] border border-slate-800 bg-slate-950/70">
      <div className="mb-2 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-400">
        <span>{graphModeLabels[mode] ?? 'Graph'}</span>
        <span>{filteredNodes.length} nodes</span>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.3, duration: 500 }}
        minZoom={0.3}
        maxZoom={1.8}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        onNodeClick={(_, node) => onNodeSelect?.(node.id)}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background color="#1e293b" gap={16} />
        <MiniMap
          pannable
          zoomable
          style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)' }}
          nodeColor={(node) => NODE_COLORS[(node.data?.type as string) ?? 'file'] ?? '#8b5cf6'}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
