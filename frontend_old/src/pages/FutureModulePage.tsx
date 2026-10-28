import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const modules = {
  security: 'Security Intelligence',
  quality: 'Code Quality',
  bugs: 'Bug Prediction',
  documentation: 'Documentation Intelligence',
  recommendations: 'Recommendations',
  assistant: 'AI Assistant',
  impact: 'Change Impact Analysis',
  drift: 'Architecture Drift',
  repositories: 'Multi-Repository Intelligence',
  discovery: 'Repository Discovery',
};

export function FutureModulePage() {
  const { module } = useParams();
  const title = modules[module as keyof typeof modules] || 'Future Intelligence Module';

  return (
    <div className="panel flex min-h-[420px] flex-col items-center justify-center p-10 text-center">
      <div className="mb-4 rounded-full border border-violet-500/30 bg-violet-500/10 p-3 text-violet-200">
        <Sparkles size={28} />
      </div>
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-3 max-w-xl text-slate-300">
        This module is intentionally ready for future backend integration. The current API surface does not expose any results yet, so this is a polished coming-soon state that fits the RepoMind product architecture.
      </p>
      <Link to="/repository" className="mt-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
        Return to workspace <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}
