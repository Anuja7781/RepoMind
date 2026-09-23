import { Code2, Database, FolderTree, Network, Search } from 'lucide-react';
import { useAnalysisStore } from '@/store/analysisStore';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function CodeIntelligencePage() {
  const analysis = useAnalysisStore((state) => state.analysis);

  if (!analysis) {
    return <div className="panel p-10 text-center text-slate-300">No code intelligence available.</div>;
  }

  const fileOverview = analysis.ast_analysis[0];

  return (
    <div className="space-y-6">
      <SectionHeader title="Code intelligence" subtitle="IDE-inspired repository intelligence" />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1.35fr]">
        <div className="panel p-4">
          <div className="mb-3 flex items-center gap-2 text-violet-200"><FolderTree size={16} /> File explorer</div>
          <div className="space-y-2 text-sm text-slate-300">
            {analysis.structure.slice(0, 10).map((item) => (
              <div key={item.path} className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
                {item.path}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-5">
            <div className="mb-3 flex items-center gap-2 text-cyan-300"><Code2 size={16} /> Selected file</div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Path</div>
              <div className="mt-2 text-base font-medium text-white">{fileOverview?.path || 'No files detected'}</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Language</div><div className="mt-2">{fileOverview?.language || '—'}</div></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Classes</div><div className="mt-2">{fileOverview?.classes.length || 0}</div></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"><div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Functions</div><div className="mt-2">{fileOverview?.functions.length || 0}</div></div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="panel p-4">
              <div className="mb-2 flex items-center gap-2 text-emerald-300"><Database size={16} /> Imports</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {(fileOverview?.imports ?? []).length ? fileOverview.imports.map((item) => <li key={item}>{item}</li>) : <li className="text-slate-500">No imports</li>}
              </ul>
            </div>
            <div className="panel p-4">
              <div className="mb-2 flex items-center gap-2 text-violet-300"><Search size={16} /> Dependencies</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {(analysis.dependency_analysis ?? []).slice(0, 5).map((item) => <li key={`${item.source_file}-${item.target_module}`}>{item.target_module}</li>)}
              </ul>
            </div>
            <div className="panel p-4">
              <div className="mb-2 flex items-center gap-2 text-cyan-300"><Network size={16} /> Relationships</div>
              <ul className="space-y-2 text-sm text-slate-300">
                {(analysis.entity_graph.edges ?? []).slice(0, 5).map((edge, index) => <li key={`${edge.source}-${edge.target}-${index}`}>{edge.relationship}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
