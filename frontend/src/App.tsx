import { useState } from "react"
import Nav from "@/components/sections/Nav"
import Hero from "@/components/sections/Hero"
import RepositoryAnalyzer from "@/components/RepositoryAnalyzer"
import Features from "@/components/sections/Features"
import HowItWorks from "@/components/sections/HowItWorks"
import AgenticAI from "@/components/sections/AgenticAI"
import UseCases from "@/components/sections/UseCases"
import Research from "@/components/sections/Research"
import FinalCTA from "@/components/sections/FinalCTA"
import Footer from "@/components/sections/Footer"
import ImpactAnalysis from "@/components/features/ImpactAnalysis"
import ArchitectureDrift from "@/components/features/ArchitectureDrift"
import RepositoryDiscovery from "@/components/features/RepositoryDiscovery"
import { GitBranch, Zap, GitMerge, Search, Home } from "lucide-react"

type Page = "home" | "analyze" | "impact" | "drift" | "discover"

// ─── Problem section ──────────────────────────────────────────────────────────
function Problem() {
  const problems = [
    { icon: "⬡", title: "Complex Codebases", desc: "Thousands of files and modules make repositories difficult to understand without spending weeks on them." },
    { icon: "◻", title: "Missing Documentation", desc: "Documentation is often incomplete, outdated, or disconnected from the actual code that matters." },
    { icon: "⬟", title: "Hidden Dependencies", desc: "Important relationships between modules and functions are impossible to discover by reading files." },
    { icon: "◈", title: "Too Many Tools", desc: "Developers need multiple separate tools to understand architecture, quality, security, and technical debt." },
  ]
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "#0d0d18" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="section-label mb-4">The Problem</div>
          <h2 className="font-black text-white" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            Repositories Were Never Meant to<br /><span className="text-gradient">Be Understood Manually.</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {problems.map(p => (
            <div key={p.title} className="card-hover rounded-xl p-6 bg-[#12121f]">
              <div className="text-violet-400 text-2xl mb-4 font-mono">{p.icon}</div>
              <h3 className="font-semibold text-white mb-2 text-sm">{p.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl p-7 bg-[#12121f] border border-red-900/20">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-soft" />
              <span className="font-mono text-xs text-red-400 uppercase tracking-widest">Without RepoMind</span>
            </div>
            {["1000+ Files to navigate","Multiple separate tools","Outdated documentation","Hidden dependencies","Manual architecture mapping","Hours of onboarding"].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className="font-mono text-xs text-red-500/50">✕</span>
                <span className="text-sm text-gray-500">{item}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-7 bg-[#12121f] border border-violet-900/25">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-soft" />
              <span className="font-mono text-xs text-violet-400 uppercase tracking-widest">With RepoMind</span>
            </div>
            {["One repository, one intelligence layer","Instant structural insights","Auto-generated documentation","Visual dependency graph","Recovered architecture in minutes","Minutes to understand any repo"].map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <span className="text-xs text-violet-400/60">→</span>
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Architecture section ─────────────────────────────────────────────────────
function ArchSection() {
  const layers = [
    { title: "User Layer",         items: ["GitHub","Chrome Extension"],                                                                                color: "#818cf8", icon: "⬡" },
    { title: "Backend Layer",      items: ["FastAPI Backend","REST API"],                                                                               color: "#7c3aed", icon: "◈" },
    { title: "Intelligence Layer", items: ["AST Parser","Dependency Analyzer","Metrics Extractor","Security Analyzer","Bug Prediction","Doc Generator"], color: "#06b6d4", icon: "⬟" },
    { title: "Agent Layer",        items: ["AI Orchestrator","9 Specialized Agents"],                                                                   color: "#0ea5e9", icon: "◻" },
    { title: "Knowledge Layer",    items: ["Knowledge Graph","Vector Database","Repository Embeddings"],                                                color: "#34d399", icon: "⬡" },
    { title: "AI Layer",           items: ["RAG Engine","LLM Inference"],                                                                               color: "#a78bfa", icon: "◈" },
    { title: "Insight Layer",      items: ["Dashboard","Reports","Graphs","AI Chat"],                                                                   color: "#f472b6", icon: "⬟" },
  ]
  return (
    <section id="architecture" className="py-24 relative grid-bg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="section-label mb-4">Technical Architecture</div>
          <h2 className="font-black text-white" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            Built for <span className="text-gradient">Repository-Level Intelligence</span>
          </h2>
        </div>
        <div className="flex flex-col items-center gap-0">
          {layers.map((layer, i) => (
            <div key={layer.title} className="w-full max-w-2xl">
              <div className="card-hover rounded-xl px-6 py-4 bg-[#12121f] flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${layer.color}15`, border: `1px solid ${layer.color}25` }}>
                  <span className="font-mono text-xs" style={{ color: layer.color }}>{layer.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="font-mono text-xs mb-1.5 font-semibold" style={{ color: layer.color }}>{layer.title}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.items.map(item => (
                      <span key={item} className="text-xs px-2 py-0.5 rounded-md border text-gray-400"
                        style={{ borderColor: `${layer.color}18`, backgroundColor: `${layer.color}07` }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {i < layers.length - 1 && (
                <div className="flex justify-center my-1.5">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-px h-3" style={{ background: `linear-gradient(to bottom, ${layer.color}50, ${layers[i+1].color}50)` }} />
                    <svg viewBox="0 0 10 7" width="10" height="7">
                      <polygon points="0,0 5,7 10,0" fill={layers[i+1].color} opacity="0.4" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Feature launcher cards ────────────────────────────────────────────────────
const FEATURE_PAGES: { key: Page; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { key: "analyze",  label: "Repository Analyzer",     icon: <GitBranch size={15} />,  desc: "Analyze any GitHub repo with AI agents and knowledge graph", color: "#818cf8" },
  { key: "impact",   label: "Change Impact Analysis",  icon: <Zap size={15} />,        desc: "Predict the blast radius of any code change before it happens", color: "#06b6d4" },
  { key: "drift",    label: "Architecture Drift",      icon: <GitMerge size={15} />,   desc: "Compare documented architecture vs. actual implementation", color: "#fbbf24" },
  { key: "discover", label: "Repository Discovery",    icon: <Search size={15} />,     desc: "Find and rank repositories that best match your project topic", color: "#34d399" },
]

function FeatureLauncher({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <section className="py-24 relative" style={{ background: "#0d0d18" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(91,80,240,0.06) 0%, transparent 60%)" }} />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <div className="section-label mb-4">Interactive Demo</div>
          <h2 className="font-black text-white mb-3" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            Try <span className="text-gradient">RepoMind AI</span> Live
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
            All four tools run on realistic mock data — no API key required. Built for demo and professor review.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURE_PAGES.map(p => (
            <button key={p.key} onClick={() => onNavigate(p.key)}
              className="card-hover rounded-xl p-5 text-left group relative overflow-hidden">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 30% 30%, ${p.color}08, transparent 70%)` }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                style={{ background: `${p.color}15`, border: `1px solid ${p.color}25`, color: p.color }}>
                {p.icon}
              </div>
              <div className="font-semibold text-white text-sm mb-1.5">{p.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed mb-3">{p.desc}</div>
              <div className="text-xs font-mono font-semibold group-hover:underline" style={{ color: p.color }}>
                Launch →
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Feature nav bar ──────────────────────────────────────────────────────────
function FeatureNav({ current, onChange }: { current: Page; onChange: (p: Page) => void }) {
  return (
    <div className="sticky top-0 z-30" style={{ background: "rgba(10,10,15,0.96)", borderBottom: "1px solid #1e1e35", backdropFilter: "blur(16px)" }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-0.5 overflow-x-auto py-0" style={{ scrollbarWidth: "none" }}>
        <button onClick={() => onChange("home")}
          className={`flex items-center gap-1.5 px-3 py-3.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${current === "home" ? "border-violet-500 text-violet-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
          <Home size={12} />Home
        </button>
        <div className="w-px h-4 bg-[#1e1e35] mx-1 shrink-0" />
        {FEATURE_PAGES.map(p => (
          <button key={p.key} onClick={() => onChange(p.key)}
            className={`flex items-center gap-1.5 px-3 py-3.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${current === p.key ? "border-violet-500 text-violet-400" : "border-transparent text-gray-500 hover:text-gray-300"}`}>
            <span style={{ color: current === p.key ? undefined : p.color }}>{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home")
  const [initialUrl, setInitialUrl] = useState("")

  const goAnalyze = (url?: string) => {
    if (url) setInitialUrl(url)
    setPage("analyze")
  }

  if (page !== "home") {
    return (
      <div className="min-h-screen overflow-x-hidden" style={{ background: "#0d0d18", color: "#e2e8f0" }}>
        <FeatureNav current={page} onChange={setPage} />
        {page === "analyze"  && <RepositoryAnalyzer initialUrl={initialUrl} />}
        {page === "impact"   && <ImpactAnalysis />}
        {page === "drift"    && <ArchitectureDrift />}
        {page === "discover" && <RepositoryDiscovery />}
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#0d0d18", color: "#e2e8f0" }}>
      <Nav onAnalyze={goAnalyze} />
      <Hero onAnalyze={goAnalyze} />
      <Problem />
      <FeatureLauncher onNavigate={setPage} />
      <Features />
      <HowItWorks />
      <AgenticAI />
      <ArchSection />
      <UseCases />
      <Research />
      <FinalCTA onAnalyze={goAnalyze} />
      <Footer />
    </div>
  )
}
