import { useState } from "react"
import { motion } from "framer-motion"
import { useScrollReveal } from "@/hooks/useScrollReveal"
import { ChevronRight, GitBranch } from "lucide-react"

export default function FinalCTA({ onAnalyze }: { onAnalyze?: (url?: string) => void }) {
  const { ref, visible } = useScrollReveal()
  const [url, setUrl] = useState("")

  const submit = () => onAnalyze?.(url.trim() || undefined)

  return (
    <section className="py-32 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(91,80,240,0.09) 0%, transparent 70%)" }} />
        <div className="grid-bg absolute inset-0 opacity-30" />
      </div>

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
        >
          <div className="section-label mb-6">Start Analyzing</div>
          <h2 className="font-black text-white leading-tight mb-4" style={{ fontSize: "clamp(2rem,5vw,3.5rem)" }}>
            Understand Any Repository.<br /><span className="text-gradient">In Minutes.</span>
          </h2>
          <p className="text-gray-500 text-sm mb-10 max-w-lg mx-auto leading-relaxed">
            Paste any public GitHub repository URL below. RepoMind's agentic AI will recover architecture, map dependencies, and build a complete intelligence model.
          </p>

          {/* URL input — mirrors hero */}
          <div className="flex rounded-xl overflow-hidden mb-6 max-w-xl mx-auto" style={{ border: "1px solid rgba(91,80,240,0.3)", boxShadow: "0 0 0 1px rgba(91,80,240,0.06), 0 4px 24px rgba(0,0,0,0.4)" }}>
            <div className="flex items-center gap-2.5 flex-1 px-4" style={{ background: "#12121f" }}>
              <GitBranch size={15} className="text-gray-600 shrink-0" />
              <input value={url} onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                placeholder="https://github.com/owner/repository"
                className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-700 outline-none font-mono py-4" />
            </div>
            <button onClick={submit} className="btn-primary font-semibold text-sm px-6 py-4 whitespace-nowrap flex items-center gap-2 shrink-0">
              Analyze <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {["vercel/next.js", "facebook/react", "microsoft/vscode"].map(p => (
              <button key={p} onClick={() => { setUrl(`https://github.com/${p}`); onAnalyze?.(`https://github.com/${p}`) }}
                className="text-xs font-mono px-3 py-1.5 rounded-full transition-all"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#64748b" }}>
                {p}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
