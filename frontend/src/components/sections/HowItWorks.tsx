import { motion } from "framer-motion"
import { useScrollReveal } from "@/hooks/useScrollReveal"

const steps = [
  { n: "01", title: "Connect",        desc: "GitHub repository is connected through the RepoMind Chrome Extension.", color: "#8b5cf6" },
  { n: "02", title: "Scan",           desc: "Repository structure and source files are collected and indexed.", color: "#7c3aed" },
  { n: "03", title: "Understand",     desc: "AST parsing, static analysis, and dependency analysis extract structured information.", color: "#6d28d9" },
  { n: "04", title: "Build Knowledge",desc: "Repository entities and relationships are represented using knowledge graphs and embeddings.", color: "#06b6d4" },
  { n: "05", title: "Reason",         desc: "Specialized AI agents analyze different aspects of the repository in parallel.", color: "#0891b2" },
  { n: "06", title: "Assist",         desc: "Insights are presented through the dashboard and AI repository assistant.", color: "#0e7490" },
]

export default function HowItWorks() {
  const { ref, visible } = useScrollReveal()

  return (
    <section id="how-it-works" className="py-28 relative grid-bg" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Process</div>
          <h2 className="font-black text-white" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            From Raw Code to<br /><span className="text-gradient">Repository Intelligence</span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* connector line */}
          <div className="hidden lg:block absolute left-0 right-0 h-px"
            style={{ top: 36, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), rgba(6,182,212,0.3), transparent)" }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-4">
                  <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center border transition-all hover:scale-110"
                    style={{ background: `radial-gradient(circle, ${step.color}20 0%, transparent 70%)`, borderColor: `${step.color}35`, boxShadow: `0 0 20px ${step.color}15` }}>
                    <span className="font-mono text-xs font-bold" style={{ color: step.color }}>{step.n}</span>
                  </div>
                  {i < 5 && <div className="lg:hidden absolute top-1/2 -right-5 -translate-y-1/2 text-gray-700 text-lg">›</div>}
                </div>
                <h3 className="font-semibold text-white text-sm mb-1.5">{step.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
