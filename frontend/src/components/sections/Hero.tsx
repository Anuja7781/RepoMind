import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { ChevronRight, GitBranch } from "lucide-react"

// ─── Animated repository graph visualization ───────────────────────────────────
function HeroViz() {
  const [scanY, setScanY] = useState(0)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [pulseNode, setPulseNode] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setScanY(p => (p + 0.35) % 100), 16)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => setPulseNode(p => (p + 1) % 8), 900)
    return () => clearInterval(interval)
  }, [])

  const nodes = [
    { id: "frontend",   x: 150, y: 90,  label: "Frontend",    color: "#818cf8", size: 8 },
    { id: "backend",    x: 360, y: 90,  label: "Backend",     color: "#06b6d4", size: 8 },
    { id: "auth",       x: 80,  y: 195, label: "Auth",        color: "#a78bfa", size: 7 },
    { id: "api",        x: 430, y: 195, label: "API",         color: "#0ea5e9", size: 7 },
    { id: "db",         x: 130, y: 300, label: "Database",    color: "#5b50f0", size: 8 },
    { id: "services",   x: 380, y: 300, label: "Services",    color: "#06b6d4", size: 7 },
    { id: "components", x: 255, y: 330, label: "Components",  color: "#818cf8", size: 7 },
    { id: "tests",      x: 255, y: 55,  label: "Tests",       color: "#67e8f9", size: 6 },
  ]
  const cx = 255, cy = 195

  const edges = [
    ["frontend","backend"],["frontend","auth"],["backend","api"],
    ["backend","db"],["api","services"],["frontend","components"],
    ["auth","db"],["services","db"],["backend","services"],
    ["tests","frontend"],["tests","backend"],
  ]

  const getNode = (id: string) => nodes.find(n => n.id === id)!

  return (
    <div className="relative w-full" style={{ height: 400 }}>
      <svg viewBox="0 0 510 390" className="w-full h-full" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="hv-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#5b50f0" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#5b50f0" stopOpacity="0" />
          </radialGradient>
          <filter id="hv-gf">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="scan-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="45%" stopColor="rgba(91,80,240,0)" />
            <stop offset="50%" stopColor="rgba(91,80,240,0.45)" />
            <stop offset="55%" stopColor="rgba(91,80,240,0)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <marker id="hv-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 Z" fill="rgba(91,80,240,0.25)" />
          </marker>
        </defs>
        <ellipse cx={cx} cy={cy} rx="215" ry="190" fill="url(#hv-glow)" />
        {[55,110,165].map(r => (
          <circle key={r} cx={cx} cy={cy} r={r} stroke="rgba(91,80,240,0.06)" strokeWidth="1" fill="none" strokeDasharray="3 5" />
        ))}
        {edges.map(([a,b]) => {
          const na = getNode(a), nb = getNode(b)
          const isAct = activeNode === a || activeNode === b
          return (
            <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={isAct ? "#818cf8" : "rgba(91,80,240,0.15)"}
              strokeWidth={isAct ? 1.5 : 0.7}
              strokeDasharray={isAct ? undefined : "3 5"}
              markerEnd={isAct ? undefined : "url(#hv-arrow)"}
              style={{ transition: "all 0.25s" }} />
          )
        })}
        {/* Scan sweep */}
        <rect x="0" y={scanY * 3.9} width="510" height="12" fill="url(#scan-g)" opacity="0.8" />
        {nodes.map((node, i) => {
          const isPulse = i === pulseNode % nodes.length
          const isAct = activeNode === node.id
          return (
            <g key={node.id}
              onMouseEnter={() => setActiveNode(node.id)}
              onMouseLeave={() => setActiveNode(null)}
              style={{ cursor: "pointer" }}>
              {isPulse && <circle cx={node.x} cy={node.y} r={node.size + 14} fill={node.color} opacity="0.05" />}
              {(isAct || isPulse) && <circle cx={node.x} cy={node.y} r={node.size + 7} fill={node.color} opacity="0.08" />}
              <circle cx={node.x} cy={node.y} r={node.size + 3} fill={node.color} opacity={isAct ? 0.12 : 0.04} style={{ transition: "opacity 0.2s" }} />
              <circle cx={node.x} cy={node.y} r={node.size}
                fill={node.color} opacity={isAct ? 1 : 0.7}
                filter={(isAct || isPulse) ? "url(#hv-gf)" : undefined}
                style={{ transition: "all 0.2s" }} />
              <circle cx={node.x} cy={node.y} r={node.size + 3}
                stroke={node.color} strokeWidth="1" fill="none" opacity={isAct ? 0.7 : 0.18}
                style={{ transition: "opacity 0.2s" }} />
              <text x={node.x} y={node.y + node.size + 14} textAnchor="middle"
                fill={isAct ? node.color : "rgba(148,163,184,0.5)"}
                fontSize="9" fontFamily="JetBrains Mono"
                style={{ transition: "fill 0.2s" }}>
                {node.label}
              </text>
            </g>
          )
        })}
        {/* Center orchestrator */}
        <circle cx={cx} cy={cy} r={34} fill="rgba(91,80,240,0.14)" stroke="rgba(91,80,240,0.45)" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r={22} fill="rgba(91,80,240,0.22)" stroke="rgba(129,140,248,0.6)" strokeWidth="1" />
        <text x={cx} y={cy - 6}  textAnchor="middle" fill="#c4b5fd" fontSize="8" fontFamily="JetBrains Mono" fontWeight="700">REPO</text>
        <text x={cx} y={cy + 4}  textAnchor="middle" fill="#c4b5fd" fontSize="8" fontFamily="JetBrains Mono" fontWeight="700">MIND</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#67e8f9" fontSize="7" fontFamily="JetBrains Mono">AI</text>
        {nodes.slice(0, 6).map(node => (
          <line key={`c-${node.id}`} x1={cx} y1={cy} x2={node.x} y2={node.y}
            stroke={node.color} strokeWidth="0.4" opacity="0.1" />
        ))}
      </svg>
      {/* IDE-like floating annotations */}
      <div className="absolute top-3 right-0 font-mono leading-relaxed hidden xl:block select-none" style={{ fontSize: 10 }}>
        <div style={{ color: "rgba(91,80,240,0.35)" }}>src/</div>
        {["├── api/","├── services/","├── models/","└── utils/"].map(l => (
          <div key={l} className="ml-2" style={{ color: "rgba(91,80,240,0.2)" }}>{l}</div>
        ))}
      </div>
      <div className="absolute bottom-6 left-0 font-mono leading-relaxed hidden xl:block select-none" style={{ fontSize: 10 }}>
        <div style={{ color: "rgba(71,85,105,0.6)" }}>// Recovering architecture...</div>
        <div style={{ color: "rgba(71,85,105,0.5)" }}>// Evidence-backed analysis ready</div>
        <div style={{ color: "rgba(52,211,153,0.4)" }}>// Knowledge graph ready ✓</div>
      </div>
    </div>
  )
}

// ─── URL input with submit ─────────────────────────────────────────────────────
function HeroInput({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (url.trim()) onSubmit(url.trim())
    else onSubmit("https://github.com/vercel/next.js")
  }

  const PRESETS = ["vercel/next.js", "facebook/react", "microsoft/vscode"]

  return (
    <div className="w-full max-w-xl">
      <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(91,80,240,0.3)", boxShadow: "0 0 0 1px rgba(91,80,240,0.06), 0 4px 24px rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-2.5 flex-1 px-4" style={{ background: "#12121f" }}>
          <GitBranch size={15} className="text-gray-600 shrink-0" />
          <input ref={inputRef} value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="https://github.com/owner/repository"
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-700 outline-none font-mono py-3.5" />
        </div>
        <button onClick={submit}
          className="btn-primary font-semibold text-sm px-5 py-3.5 whitespace-nowrap flex items-center gap-2 shrink-0">
          Analyze <ChevronRight size={14} />
        </button>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="text-xs font-mono" style={{ color: "#2a2a45" }}>Try:</span>
        {PRESETS.map(p => (
          <button key={p} onClick={() => { setUrl(`https://github.com/${p}`); setTimeout(submit, 0) }}
            className="text-xs font-mono px-2.5 py-1 rounded-full transition-all"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = "#a5b4fc"; (e.target as HTMLElement).style.borderColor = "rgba(91,80,240,0.3)" }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = "#64748b"; (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)" }}>
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const childVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Hero({ onAnalyze }: { onAnalyze?: (url?: string) => void }) {
  return (
    <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-12 overflow-hidden grid-bg">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(91,80,240,0.06) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* ─── Copy + input ─────────────────────────────────────────────── */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex flex-col gap-7">
            <motion.div variants={childVariants}>
              <span className="tag-chip inline-flex items-center gap-1.5">
                <span style={{ color: "#818cf8" }}>✦</span> Agentic Repository Intelligence
              </span>
            </motion.div>

            <motion.div variants={childVariants} className="space-y-4">
              <h1 className="font-black leading-[0.95] tracking-tight" style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.4rem)" }}>
                <span className="text-white">Understand</span><br />
                <span className="text-white">Any</span>{" "}
                <span className="text-gradient">Repository.</span>
              </h1>
              <p className="text-gray-400 leading-relaxed" style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)", maxWidth: "38ch" }}>
                Recover architecture, explore dependencies, understand code relationships, and discover repository intelligence with AI-powered analysis.
              </p>
            </motion.div>

            {/* URL input — the actual product entry point */}
            <motion.div variants={childVariants}>
              <HeroInput onSubmit={url => onAnalyze?.(url)} />
            </motion.div>

            {/* Intelligence flow */}
            <motion.div variants={childVariants}>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "AST Parsing",      color: "#818cf8" },
                  { label: "Knowledge Graph",   color: "#06b6d4" },
                  { label: "Multi-Agent AI",    color: "#a78bfa" },
                  { label: "RAG",               color: "#34d399" },
                  { label: "Architecture",      color: "#5b50f0" },
                ].map(t => (
                  <span key={t.label} className="font-mono text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color, opacity: 0.7 }} />
                    {t.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* ─── Visualization panel ──────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25, duration: 0.6 }}>
            <div className="glass rounded-2xl p-4 glow-violet overflow-hidden">
              {/* Terminal chrome */}
              <div className="flex items-center gap-1.5 mb-3 pb-3" style={{ borderBottom: "1px solid rgba(91,80,240,0.1)" }}>
                {["#ef4444","#fbbf24","#34d399"].map((c, i) => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, opacity: 0.6 }} />
                ))}
                <span className="ml-2 font-mono text-xs" style={{ color: "#2a2a45" }}>repomind.viz — architecture-graph</span>
                <span className="ml-auto font-mono text-xs px-2 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>
                  Live
                </span>
              </div>
              <HeroViz />
            </div>
          </motion.div>

        </div>

        {/* ─── Bottom stat strip ────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-16 pt-8 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-xl"
          style={{ border: "1px solid #1e1e35", background: "#1e1e35" }}>
          {[
            { n: "9",    label: "AI Agents",           sub: "Specialized" },
            { n: "15",   label: "Intelligence Modules", sub: "Integrated"  },
            { n: "2.4k", label: "Files Analyzed",       sub: "Per session"  },
            { n: "~10s", label: "Analysis Time",        sub: "Demo mode"   },
          ].map(s => (
            <div key={s.label} className="px-6 py-5" style={{ background: "#0d0d18" }}>
              <div className="font-black font-mono text-xl" style={{ color: "#818cf8" }}>{s.n}</div>
              <div className="text-sm font-medium text-white mt-0.5">{s.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{s.sub}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
