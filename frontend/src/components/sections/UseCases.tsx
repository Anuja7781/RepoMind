import { motion } from "framer-motion"
import { useScrollReveal } from "@/hooks/useScrollReveal"

const cases = [
  { icon: "◈", title: "Developers", desc: "Understand unfamiliar repositories quickly. Onboard to any codebase in minutes, not weeks.", color: "#8b5cf6" },
  { icon: "⬟", title: "Students", desc: "Learn how real-world software systems are structured, how modules interact, and how professional code is organized.", color: "#06b6d4" },
  { icon: "⬡", title: "Engineering Teams", desc: "Identify quality, security, and maintenance issues systematically. Keep technical debt visible and actionable.", color: "#34d399" },
  { icon: "◻", title: "Organizations", desc: "Reduce repository onboarding effort, improve maintainability, and make better architectural decisions at scale.", color: "#fbbf24" },
]

export default function UseCases() {
  const { ref, visible } = useScrollReveal()
  return (
    <section id="use-cases" className="py-28 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Use Cases</div>
          <h2 className="font-black text-white" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            Built for Anyone Who Needs to<br /><span className="text-gradient">Understand Code Faster</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cases.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="card-hover rounded-2xl p-6 bg-[#0e0e1a] group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                style={{ background: `${c.color}15`, border: `1px solid ${c.color}25` }}>
                <span className="font-mono text-lg" style={{ color: c.color }}>{c.icon}</span>
              </div>
              <h3 className="font-semibold text-white mb-2">{c.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
