import { Maximize2 as Fit, Search, Target, ZoomIn, ZoomOut } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAnalysisStore } from '@/store/analysisStore';
import { RepositoryGraphCanvas } from '@/features/graph/RepositoryGraphCanvas';
import { SectionHeader } from '@/components/ui/SectionHeader';

const graphModeOptions = ['all', 'file', 'module', 'class', 'function', 'method'] as const;

export function GraphPage() {
  const analysis = useAnalysisStore((state) => state.analysis);
  const selectedNodeId = useAnalysisStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useAnalysisStore((state) => state.setSelectedNodeId);
  const selectedFile = useAnalysisStore((state) => state.selectedFile);
  const setSelectedFile = useAnalysisStore((state) => state.setSelectedFile);
  const [graphMode, setGraphMode] = useState<(typeof graphModeOptions)[number]>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedNode = useMemo(() => {
    if (!analysis || !selectedNodeId) return null;
    return analysis.dependency_graph.nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [analysis, selectedNodeId]);

  if (!analysis) {
    return <div className="panel p-10 text-center text-slate-300">No dependency graph available.</div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Knowledge graph"
        subtitle="Repository entities, imports and relationships"
        action={
          <div className="flex items-center gap-2">
            <button type="button" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200"><ZoomIn size={14} /></button>
            <button type="button" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200"><ZoomOut size={14} /></button>
            <button type="button" className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-sm text-slate-200"><Fit size={14} /></button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.7fr]">
        <div className="panel p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-violet-200"><Target size={16} /> Graph controls</div>
            <div className="flex flex-wrap items-center gap-2">
              {graphModeOptions.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setGraphMode(mode)}
                  className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${
                    graphMode === mode ? 'border-violet-500/50 bg-violet-500/15 text-violet-100' : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  {mode === 'all' ? 'All' : mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-300">
            <Search size={14} className="text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Search entities, files, classes..."
            />
          </div>

          <RepositoryGraphCanvas
            graph={analysis.entity_graph}
            mode={graphMode}
            selectedNodeId={selectedNodeId}
            searchQuery={searchTerm}
            onNodeSelect={(nodeId) => {
              setSelectedNodeId(nodeId);
              const node = analysis.entity_graph.nodes.find((item) => item.id === nodeId);
              if (node?.node_type === 'file') {
                const match = node.label.includes('.') ? node.label : null;
                const fileName = match ? analysis.source_files.find((item) => item.path.endsWith(node.label))?.path : null;
                if (fileName) setSelectedFile(fileName);
              }
            }}
          />
        </div>

        <div className="panel p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">Selected entity</div>
          {selectedNode ? (
            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Name</div>
                <div className="mt-1 text-base text-white">{selectedNode.label}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Type</div>
                <div className="mt-1 text-white">{selectedNode.node_type}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Relationships</div>
                <div className="mt-2">{analysis.entity_graph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id).length}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(selectedFile || analysis.source_files[0]?.path || null)}
                className="w-full rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-200 hover:bg-violet-500/20"
              >
                Open file intelligence
              </button>
            </div>
          ) : (
            <div className="text-sm text-slate-400">Select a graph node to inspect its intelligence.</div>
          )}
        </div>
      </div>
    </div>
  );
}
