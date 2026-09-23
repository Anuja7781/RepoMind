import { motion } from "framer-motion"
import { useScrollReveal } from "@/hooks/useScrollReveal"
import { Bot } from "lucide-react"

const cards = [
  {
    id: "arch", title: "Architecture Recovery", icon: "◈", color: "#8b5cf6", size: "lg",
    desc: "Automatically discover the architecture of a repository and generate understandable views.",
    visual: (
      <div className="flex flex-col items-center gap-1 pt-2 pb-1">
        {[{ l: "Frontend", c: "#8b5cf6", w: "70%" }, { l: "API", c: "#a78bfa", w: "55%" }, { l: "Services", c: "#06b6d4", w: "65%" }, { l: "Database", c: "#0ea5e9", w: "45%" }].map((x, i) => (
          <div key={x.l} className="w-full">
            <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/[0.05]">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: x.c }} />
              <span className="font-mono text-xs text-gray-400">{x.l}</span>
              <div className="ml-auto h-1 rounded-full bg-white/10" style={{ width: 50 }}>
                <div className="h-full rounded-full" style={{ backgroundColor: x.c, width: x.w }} />
              </div>
            </div>
            {i < 3 && <div className="flex justify-center my-0.5"><span className="text-violet-500/30 text-xs">↓</span></div>}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "kg", title: "Knowledge Graph", icon: "◻", color: "#06b6d4", size: "sm",
    desc: "Turn files, classes, functions, and relationships into an interactive knowledge graph.",
    visual: (
      <svg viewBox="0 0 140 90" className="w-full h-20 mt-2">
        {[[70,45],[25,20],[115,20],[25,70],[115,70]].map(([x,y],i) => (
          <g key={i}>
            {i>0 && <line x1={70} y1={45} x2={x} y2={y} stroke="#06b6d4" strokeWidth="1" opacity="0.3" />}
            <circle cx={x} cy={y} r={i===0?8:5} fill={i===0?"rgba(6,182,212,0.3)":"rgba(6,182,212,0.15)"} stroke="#06b6d4" strokeWidth="1" strokeOpacity="0.5" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "dep", title: "Dependency Analysis", icon: "⬟", color: "#818cf8", size: "sm",
    desc: "Discover how modules, files, functions, and components depend on each other.",
    visual: null,
  },
  {
    id: "quality", title: "Code Quality Intelligence", icon: "⬡", color: "#34d399", size: "sm",
    desc: "Identify complexity, coupling, duplication, and maintainability issues.",
    visual: (
      <div className="space-y-1.5 mt-2">
        {[["Complexity","72","#34d399"],["Maintainability","85","#06b6d4"],["Coupling","61","#fbbf24"]].map(([l,v,c]) => (
          <div key={l as string} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-24 shrink-0">{l}</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full">
              <div className="h-full rounded-full" style={{ backgroundColor: c as string, width: `${v}%` }} />
            </div>
            <span className="font-mono text-xs" style={{ color: c as string }}>{v}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "security", title: "Security Insights", icon: "◈", color: "#f472b6", size: "sm",
    desc: "Detect potential vulnerabilities and risky patterns with actionable recommendations.",
    visual: (
      <div className="space-y-1 mt-2">
        {[["Critical",1,"#ef4444"],["High",2,"#f97316"],["Medium",2,"#fbbf24"],["Low",2,"#34d399"]].map(([l,n,c]) => (
          <div key={l as string} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c as string }} />
            <span className="text-xs text-gray-500 flex-1">{l}</span>
            <span className="font-mono text-xs" style={{ color: c as string }}>{n}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "bug", title: "Bug Risk Prediction", icon: "⬟", color: "#fbbf24", size: "sm",
    desc: "Identify modules likely to contain defects based on code and repository signals.",
    visual: (
      <div className="flex items-end gap-1 h-12 mt-2">
        {[35,55,48,72,65,80,62].map((h,i) => (
          <div key={i} className="flex-1 rounded-sm" style={{ height:`${h}%`, backgroundColor: i===5?"#fbbf24":`rgba(251,191,36,${0.2+i*0.05})` }} />
        ))}
      </div>
    ),
  },
  {
    id: "debt", title: "Technical Debt", icon: "⬡", color: "#fb923c", size: "sm",
    desc: "Discover areas that may become difficult or expensive to maintain.",
    visual: null,
  },
  {
    id: "docs", title: "Documentation Generation", icon: "◻", color: "#38bdf8", size: "sm",
    desc: "Automatically generate understandable documentation from repository structure.",
    visual: null,
  },
  {
    id: "chat", title: "Ask Your Repository Anything.", icon: "ai", color: "#8b5cf6", size: "wide",
    desc: "Chat with your codebase using RAG-powered, repository-aware AI that understands your entire project.",
    visual: (
      <div className="mt-3 bg-[#080810] rounded-xl p-3 border border-white/[0.06] space-y-2">
        <div className="flex justify-end">
          <div className="bg-violet-600/20 border border-violet-500/20 rounded-xl rounded-tr-sm px-3 py-2 max-w-xs">
            <p className="text-xs text-gray-300">Where is authentication handled?</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 flex-shrink-0 flex items-center justify-center mt-0.5">
            <Bot size={10} className="text-violet-400" />
          </div>
          <div className="bg-white/[0.04] border border-white/[0.05] rounded-xl rounded-tl-sm px-3 py-2 max-w-sm">
            <p className="text-xs text-gray-400">Authentication is handled in <code className="text-violet-400 font-mono text-xs bg-violet-500/10 px-1 rounded">src/auth/AuthService.py</code></p>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {["→ UserController","→ LoginAPI","→ SessionManager"].map(r => (
                <span key={r} className="font-mono text-xs text-cyan-400/70 bg-cyan-500/10 border border-cyan-500/20 px-1 py-0.5 rounded text-xs">{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

export default function Features() {
  const { ref, visible } = useScrollReveal()

  return (
    <section id="features" className="py-28 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Capabilities</div>
          <h2 className="font-black text-white" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            Everything You Need to<br /><span className="text-gradient">Understand a Codebase</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto">
          {/* Architecture — tall (spans 2 rows in lg) */}
          {cards.map((card, i) => {
            const isLg = card.size === "lg"
            const isWide = card.size === "wide"
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className={`card-hover rounded-2xl p-5 bg-[#0e0e1a] flex flex-col ${isLg ? "lg:row-span-2" : ""} ${isWide ? "md:col-span-2 lg:col-span-4" : ""}`}
              >
                {card.icon === "ai" ? (
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="lg:w-1/3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/20 border border-violet-500/30">
                          <Bot size={16} className="text-violet-400" />
                        </div>
                        <span className="tag-chip">Repository-aware AI</span>
                      </div>
                      <h3 className="font-semibold text-white mb-2">{card.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
                    </div>
                    <div className="lg:flex-1">{card.visual}</div>
                  </div>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 shrink-0"
                      style={{ background: `${card.color}15`, border: `1px solid ${card.color}25` }}>
                      <span className="font-mono text-base" style={{ color: card.color }}>{card.icon}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-1.5 text-sm">{card.title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{card.desc}</p>
                    {card.visual && <div className="flex-1 flex flex-col justify-end">{card.visual}</div>}
                  </>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
