function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="8" cy="8" r="3" fill="#7c3aed" opacity="0.9" />
      <circle cx="8" cy="24" r="3" fill="#7c3aed" opacity="0.9" />
      <circle cx="24" cy="16" r="3" fill="#06b6d4" opacity="0.9" />
      <line x1="8" y1="11" x2="8" y2="21" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5" />
      <line x1="11" y1="8" x2="21" y2="14" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5" />
      <line x1="11" y1="24" x2="21" y2="18" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
      <circle cx="16" cy="16" r="2.5" fill="#8b5cf6" />
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="border-t border-violet-900/20 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Logo />
              <span className="font-bold text-white text-sm">RepoMind <span className="text-violet-400">AI</span></span>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">Intelligent Repository Understanding for Modern Software Engineering.</p>
          </div>
          {[
            { title: "Product", links: ["Features","Architecture","Research","GitHub","Documentation"] },
            { title: "Technology", links: ["Agentic AI","LLMs","RAG","Knowledge Graphs","Static Analysis"] },
            { title: "Connect", links: ["GitHub Repository","Research Paper","Chrome Extension","API Reference"] },
          ].map(col => (
            <div key={col.title}>
              <div className="font-mono text-xs text-gray-700 uppercase tracking-widest mb-4">{col.title}</div>
              <div className="space-y-2">
                {col.links.map(l => (
                  <a key={l} href="#" className="block text-sm text-gray-600 hover:text-gray-300 transition-colors">{l}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/[0.04] gap-4">
          <span className="font-mono text-xs text-gray-700">© 2026 RepoMind AI. All rights reserved.</span>
          <div className="flex flex-wrap gap-4">
            {["AST Parsing","Knowledge Graphs","RAG","Multi-Agent AI"].map(t => (
              <span key={t} className="font-mono text-xs text-gray-800">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
