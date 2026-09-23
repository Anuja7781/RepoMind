import { Database, FolderTree, Layers3, Package } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { RepositoryTree } from '@/features/repository/RepositoryTree';
import { useAnalysisStore } from '@/store/analysisStore';
import { SectionHeader } from '@/components/ui/SectionHeader';

export function RepositoryPage() {
  const analysis = useAnalysisStore((state) => state.analysis);
  const setSelectedFile = useAnalysisStore((state) => state.setSelectedFile);
  const setSelectedNodeId = useAnalysisStore((state) => state.setSelectedNodeId);
  const selectedFile = useAnalysisStore((state) => state.selectedFile);

  const fileIntelligence = useMemo(() => {
    if (!analysis) return null;
    const activeFile = analysis.source_files.find((item) => item.path === selectedFile) ?? analysis.source_files[0];
    const ast = analysis.ast_analysis.find((item) => item.path === activeFile?.path) ?? analysis.ast_analysis[0];
    return { file: activeFile, ast };
  }, [analysis, selectedFile]);

  useEffect(() => {
    if (analysis && !selectedFile && analysis.source_files[0]) {
      setSelectedFile(analysis.source_files[0].path);
    }
  }, [analysis, selectedFile, setSelectedFile]);

  if (!analysis) {
    return (
      <div className="panel p-10 text-center text-slate-300">
        No repository analysis available yet. Start with a GitHub URL from the landing page.
      </div>
    );
  }

  const summary = [
    { label: 'Files', value: analysis.source_files.length },
    { label: 'Classes', value: analysis.ast_analysis.flatMap((item) => item.class_details).length },
    { label: 'Functions', value: analysis.ast_analysis.flatMap((item) => item.function_details).length },
    { label: 'Methods', value: analysis.ast_analysis.flatMap((item) => item.class_details.flatMap((cls) => cls.methods)).length },
    { label: 'Imports', value: analysis.ast_analysis.flatMap((item) => item.imports).length },
    { label: 'Dependencies', value: analysis.dependency_analysis.length },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title={`${analysis.owner}/${analysis.name}`}
        subtitle={`${analysis.default_branch} • ${Object.keys(analysis.languages).join(', ') || 'Language unknown'}`}
        action={<button type="button" className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200">New Analysis</button>}
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {summary.map(({ label, value }) => (
          <div key={label} className="panel p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.4fr]">
        <RepositoryTree
          items={analysis.structure}
          selectedPath={selectedFile}
          onSelect={(path) => {
            setSelectedFile(path);
            setSelectedNodeId(null);
          }}
        />

        <div className="space-y-6">
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-2 text-violet-200">
              <Database size={18} />
              <span className="font-medium">File intelligence</span>
            </div>

            {fileIntelligence?.file ? (
              <div className="space-y-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected file</div>
                  <div className="mt-2 text-xl font-semibold text-white">{fileIntelligence.file.path}</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Language</div>
                    <div className="mt-2 text-sm text-white">{fileIntelligence.file.language}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Imports</div>
                    <div className="mt-2 text-sm text-white">{fileIntelligence.ast?.imports.length ?? 0}</div>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Dependencies</div>
                    <div className="mt-2 text-sm text-white">{analysis.dependency_analysis.filter((dep) => dep.source_file === fileIntelligence.file.path).length}</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="mb-2 flex items-center gap-2 text-cyan-300"><FolderTree size={16} /> <span>Overview</span></div>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li><span className="text-slate-500">Path:</span> {fileIntelligence.file.path}</li>
                      <li><span className="text-slate-500">Language:</span> {fileIntelligence.file.language}</li>
                      <li><span className="text-slate-500">Imports:</span> {fileIntelligence.ast?.imports.join(', ') || '—'}</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="mb-2 flex items-center gap-2 text-violet-300"><Layers3 size={16} /> <span>Entities</span></div>
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li><span className="text-slate-500">Classes:</span> {fileIntelligence.ast?.classes.join(', ') || '—'}</li>
                      <li><span className="text-slate-500">Functions:</span> {fileIntelligence.ast?.functions.join(', ') || '—'}</li>
                      <li><span className="text-slate-500">Methods:</span> {fileIntelligence.ast?.class_details.flatMap((item) => item.methods.map((method) => method.name)).join(', ') || '—'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 px-4 py-6 text-sm text-slate-400">Select a file from the repository tree to inspect its intelligence.</div>
            )}
          </div>

          <div className="panel p-5">
            <div className="mb-3 flex items-center gap-2 text-emerald-300"><Package size={16} /> <span>Repository metadata</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Stars</div>
                <div className="mt-2 text-lg text-white">{analysis.stars}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Forks</div>
                <div className="mt-2 text-lg text-white">{analysis.forks}</div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 sm:col-span-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Description</div>
                <div className="mt-2 text-sm text-slate-300">{analysis.description || 'No description available'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
