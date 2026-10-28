import { Boxes, GitBranch, Info, Layers3, Search, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAnalysisStore } from '@/store/analysisStore';
import { RepositoryGraphCanvas } from '@/features/graph/RepositoryGraphCanvas';
import { SectionHeader } from '@/components/ui/SectionHeader';

const graphModeOptions = ['all', 'file', 'module', 'class', 'function', 'method'] as const;

export function ArchitecturePage() {
  const analysis = useAnalysisStore((state) => state.analysis);
  const setSelectedFile = useAnalysisStore((state) => state.setSelectedFile);
  const selectedNodeId = useAnalysisStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useAnalysisStore((state) => state.setSelectedNodeId);
  const [graphMode, setGraphMode] = useState<(typeof graphModeOptions)[number]>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const components = useMemo(() => analysis?.architecture_analysis.components ?? [], [analysis]);
  const relationships = useMemo(() => analysis?.architecture_analysis.relationships ?? [], [analysis]);

  const selectedNode = useMemo(() => {
    if (!analysis || !selectedNodeId) return null;
    return analysis.dependency_graph.nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [analysis, selectedNodeId]);

  if (!analysis) {
    return <div className="panel p-10 text-center text-slate-300">No architecture data available yet.</div>;
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Architecture Intelligence"
        subtitle={`${analysis.owner}/${analysis.name} • dependency flow and structure`}
        action={<button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200"><Search size={14} /> Search</button>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.7fr]">
        <div className="space-y-4">
          <div className="panel p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-violet-200"><Layers3 size={18} /> Architecture graph</div>
              <div className="flex flex-wrap items-center gap-2">
                {graphModeOptions.map((mode) => (
                  <button
                    type="button"
                    key={mode}
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
                placeholder="Search architecture entities"
              />
            </div>

            <RepositoryGraphCanvas
              graph={analysis.dependency_graph}
              mode={graphMode}
              selectedNodeId={selectedNodeId}
              searchQuery={searchTerm}
              onNodeSelect={(nodeId) => {
                setSelectedNodeId(nodeId);
                const matched = analysis.dependency_graph.nodes.find((node) => node.id === nodeId);
                if (matched?.node_type === 'file') {
                  const fileLike = matched.label.includes('/') ? matched.label : null;
                  if (fileLike) {
                    setSelectedFile(fileLike);
                  }
                }
              }}
            />
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2 text-slate-300"><Info size={15} /> Architecture story</div>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Entry points detected: {components.filter((item) => item.name === 'application').length || 0}</li>
              <li>Modules identified: {components.length}</li>
              <li>Internal relationships detected: {relationships.length}</li>
              <li>Dependency flow identified: {relationships.length > 0 ? 'Available from backend relationships' : 'No internal dependency relationships were detected'}</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-4">
            <div className="mb-3 flex items-center gap-2 text-cyan-300"><GitBranch size={16} /> Architecture summary</div>
            <div className="space-y-3">
              {components.length ? components.map((component) => (
                <div key={component.name} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-white">{component.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{component.component_type}</div>
                    </div>
                    <Boxes size={15} className="text-violet-300" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {component.files.slice(0, 4).map((file) => (
                      <button
                        type="button"
                        key={file}
                        onClick={() => setSelectedFile(file)}
                        className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[10px] text-slate-300 hover:border-violet-500/40 hover:text-white"
                      >
                        {file}
                      </button>
                    ))}
                  </div>
                </div>
              )) : <div className="text-sm text-slate-400">No architecture components detected.</div>}
            </div>
          </div>

          {selectedNode ? (
            <div className="panel p-4">
              <div className="mb-3 flex items-center gap-2 text-violet-200"><Target size={16} /> Node intelligence</div>
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
                  <div className="mt-2">{analysis.dependency_graph.edges.filter((edge) => edge.source === selectedNode.id || edge.target === selectedNode.id).length}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
