import { ArrowRight, CheckCircle2, LoaderCircle, Server } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAnalysisStore } from '@/store/analysisStore';
import { SectionHeader } from '@/components/ui/SectionHeader';

const steps = [
  'Connecting to GitHub',
  'Repository structure',
  'Source files',
  'AST analysis',
  'Dependency analysis',
  'Architecture recovery',
];

export function AnalysisPage() {
  const analysis = useAnalysisStore((state) => state.analysis);

  useEffect(() => {
    if (!analysis) {
      return;
    }
  }, [analysis]);

  if (!analysis) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Analysis" subtitle="Running a repository intelligence pass" />
        <div className="panel p-6">
          <div className="flex items-center gap-3 text-violet-200">
            <LoaderCircle className="animate-spin" size={18} />
            <span className="font-medium">Connecting to GitHub</span>
          </div>
          <div className="mt-5 space-y-3">
            {steps.map((step) => (
              <div key={step} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-300">
                <span>{step}</span>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">Queued</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Analysis complete"
        subtitle={`${analysis.owner}/${analysis.name}`} 
        action={<Link to="/repository" className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-200">Open workspace <ArrowRight size={14} /></Link>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step) => (
          <div key={step} className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-slate-300">{step}</span>
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="h-2 rounded-full bg-slate-800">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
            </div>
          </div>
        ))}
      </div>

      <div className="panel p-6">
        <div className="mb-4 flex items-center gap-2 text-emerald-300">
          <Server size={18} />
          <span className="font-medium">Live backend data</span>
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Repository</dt>
            <dd className="mt-1 text-lg text-white">{analysis.owner}/{analysis.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Branch</dt>
            <dd className="mt-1 text-lg text-white">{analysis.default_branch}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">Languages</dt>
            <dd className="mt-1 text-lg text-white">{Object.keys(analysis.languages).join(', ') || '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
