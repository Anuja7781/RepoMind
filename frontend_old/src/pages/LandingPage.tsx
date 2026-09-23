import { ArrowRight, Blocks, GitBranch, Layers3, SearchCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRepositoryAnalysis } from '@/hooks/useRepositoryAnalysis';
import { useAnalysisStore } from '@/store/analysisStore';

const capabilities = [
  'Repository Structure',
  'AST Analysis',
  'Dependency Intelligence',
  'Architecture Recovery',
];

export function LandingPage() {
  const [url, setUrl] = useState('https://github.com/fastapi/fastapi');
  const navigate = useNavigate();
  const mutation = useRepositoryAnalysis();
  const setAnalysis = useAnalysisStore((state) => state.setAnalysis);

  const handleAnalyze = async () => {
    try {
      const result = await mutation.mutateAsync(url);
      setAnalysis(result);
      navigate('/repository');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 py-8">
      <section className="panel relative overflow-hidden px-6 py-10 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="relative grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-200">
              <SearchCheck size={12} />
              Developer intelligence
            </div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Understand Any Repository.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-300">
              Turn a GitHub repository into an interactive map of its structure, entities, dependencies and architecture.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-500 focus:border-violet-500/50"
                placeholder="https://github.com/owner/repository"
              />
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={mutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 font-medium text-white shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {mutation.isPending ? 'Analyzing...' : 'Analyze Repository'}
                <ArrowRight size={16} />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {capabilities.map((item) => (
                <span key={item} className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">{item}</span>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Repository Structure', icon: Blocks },
              { label: 'AST Analysis', icon: Layers3 },
              { label: 'Dependency Intelligence', icon: GitBranch },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="panel flex items-center gap-3 p-3">
                <div className="rounded-xl bg-violet-500/10 p-2 text-violet-300">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{label}</div>
                  <div className="text-xs text-slate-400">Real repository evidence</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel p-4">
          <div className="text-sm text-slate-400">Repository Structure</div>
          <div className="mt-2 text-xl font-semibold text-white">Tree + file metadata</div>
        </div>
        <div className="panel p-4">
          <div className="text-sm text-slate-400">AST Analysis</div>
          <div className="mt-2 text-xl font-semibold text-white">Imports, classes, functions</div>
        </div>
        <div className="panel p-4">
          <div className="text-sm text-slate-400">Architecture</div>
          <div className="mt-2 text-xl font-semibold text-white">Components + relationships</div>
        </div>
      </section>

      <div className="flex justify-center">
        <Link to="/analyze" className="text-sm text-violet-300 hover:text-violet-200">View analysis state →</Link>
      </div>
    </div>
  );
}
