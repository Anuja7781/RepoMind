import { motion } from "framer-motion"
import { useScrollReveal } from "@/hooks/useScrollReveal"
import { BookOpen, ChevronRight } from "lucide-react"

const techs = [
  { label: "Agentic AI",           color: "#8b5cf6" },
  { label: "LLMs",                 color: "#a78bfa" },
  { label: "RAG",                  color: "#06b6d4" },
  { label: "AST Parsing",          color: "#0ea5e9" },
  { label: "Static Analysis",      color: "#34d399" },
  { label: "Knowledge Graphs",     color: "#fbbf24" },
  { label: "Vector Search",        color: "#fb923c" },
  { label: "GitHub API",           color: "#f472b6" },
  { label: "Multi-Agent Systems",  color: "#c4b5fd" },
  { label: "Code Embeddings",      color: "#67e8f9" },
]

export default function Research() {
  const { ref, visible } = useScrollReveal()
  return (
    <section id="research" className="py-28 relative grid-bg" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Research & Innovation</div>
          <h2 className="font-black text-white" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            Where Software Engineering<br /><span className="text-gradient">Meets Agentic AI</span>
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {techs.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={visible ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="card-hover px-5 py-2.5 rounded-full bg-[#0e0e1a] flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-sm font-medium text-gray-300">{t.label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="rounded-2xl p-8 bg-[#0e0e1a] border-gradient">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-3">Built on Research. Designed for Developers.</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-5">
                  Recent research has explored repository-level agents, architecture recovery, code intelligence, retrieval-augmented generation, and agentic software engineering. RepoMind brings these ideas together into a unified repository intelligence workflow — bridging academic research with practical developer tooling.
                </p>
                <button className="btn-secondary text-sm text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2">
                  Explore Research <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
