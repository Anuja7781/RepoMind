import { NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, Box, BrainCircuit, Code2, GitBranch, Home, Layers3, Search, Sparkles } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';

const navItems = [
  { to: '/', label: 'Overview', icon: Home },
  { to: '/analyze', label: 'Analyze', icon: BrainCircuit },
  { to: '/repository', label: 'Workspace', icon: Code2 },
  { to: '/repository/architecture', label: 'Architecture', icon: Layers3 },
  { to: '/repository/graph', label: 'Graph', icon: Box },
  { to: '/repository/code', label: 'Code', icon: GitBranch },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [commandOpen, setCommandOpen] = useState(false);

  const repositoryLabel = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments[0] === 'repository' && segments[1]) return segments[1];
    return 'RepoMind AI';
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-cyan-400 text-sm font-bold text-white shadow-glow">
              R
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">RepoMind AI</div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition ${
                    isActive ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/30' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300 md:flex"
            >
              <Search size={12} />
              <span>Quick search</span>
              <span className="kbd">Ctrl K</span>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300">
              <Sparkles size={12} className="text-violet-300" />
              {repositoryLabel}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>

      {commandOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/75 px-4 pt-20 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl ring-1 ring-violet-500/20">
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
              <Search size={15} className="text-violet-300" />
              <input
                autoFocus
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="Search repositories, files, modules, classes, methods..."
              />
            </div>
            <div className="space-y-2 text-sm text-slate-300">
              {[
                'Go to Overview',
                'Go to Architecture',
                'Go to Graph',
                'Go to Code Intelligence',
                'New Analysis',
                'Fit Graph',
                'Reset Graph',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCommandOpen(false)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-left hover:border-violet-500/40 hover:text-white"
                >
                  <span>{item}</span>
                  <ArrowRight size={14} className="text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
