import { useState } from "react"
import { motion } from "framer-motion"
import { useScrollReveal } from "@/hooks/useScrollReveal"

const agents = [
  { id: "repo",   label: "Repository\nUnderstanding", color: "#8b5cf6", angle: -90, r: 160 },
  { id: "arch",   label: "Architecture\nRecovery",    color: "#a78bfa", angle: -40, r: 160 },
  { id: "dep",    label: "Dependency\nAnalysis",      color: "#06b6d4", angle: 10,  r: 160 },
  { id: "kg",     label: "Knowledge\nGraph",          color: "#0ea5e9", angle: 60,  r: 160 },
  { id: "quality",label: "Code Quality\nAgent",       color: "#34d399", angle: 110, r: 160 },
  { id: "sec",    label: "Security\nAnalysis",        color: "#f472b6", angle: 160, r: 160 },
  { id: "docs",   label: "Documentation\nAgent",      color: "#fbbf24", angle: -160,r: 160 },
  { id: "feat",   label: "Feature\nRecommendation",   color: "#fb923c", angle: -130,r: 160 },
  { id: "chat",   label: "Repository\nChat",          color: "#c4b5fd", angle: -115,r: 160 },
]

export default function AgenticAI() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null)
  const { ref, visible } = useScrollReveal()

  return (
    <section className="py-28 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.05) 0%, transparent 70%)" }} />
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }}
        >
          <div className="section-label mb-4">Agentic Architecture</div>
          <h2 className="font-black text-white" style={{ fontSize: "clamp(1.8rem,4vw,3rem)" }}>
            One Repository. <span className="text-gradient">Multiple AI Specialists.</span>
          </h2>
          <p className="mt-4 text-gray-400 text-sm max-w-lg mx-auto">
            Instead of asking one AI to do everything, RepoMind coordinates specialized agents through an intelligent orchestrator.
          </p>
        </motion.div>

        <div className="flex justify-center">
          <div className="relative" style={{ width: 400, height: 400 }}>
            <svg viewBox="0 0 400 400" className="w-full h-full absolute inset-0">
              <defs>
                <radialGradient id="orch-g">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="200" cy="200" r="190" stroke="rgba(124,58,237,0.05)" strokeWidth="1" fill="none" />
              <circle cx="200" cy="200" r="140" stroke="rgba(124,58,237,0.08)" strokeWidth="1" fill="none" strokeDasharray="3 5" />

              {agents.map(agent => {
                const rad = (agent.angle * Math.PI) / 180
                const nx = 200 + agent.r * Math.cos(rad)
                const ny = 200 + agent.r * Math.sin(rad)
                const isAct = activeAgent === agent.id
                return (
                  <g key={agent.id}>
                    <line x1="200" y1="200" x2={nx} y2={ny}
                      stroke={agent.color} strokeWidth={isAct ? 1.5 : 0.7}
                      opacity={isAct ? 0.8 : 0.2} strokeDasharray={isAct ? "none" : "3 4"}
                      style={{ transition: "all 0.2s" }} />
                    <circle cx={nx} cy={ny} r={20}
                      fill={isAct ? `${agent.color}20` : "rgba(14,14,26,0.9)"}
                      stroke={agent.color} strokeWidth={isAct ? 1.5 : 1}
                      strokeOpacity={isAct ? 1 : 0.4}
                      onMouseEnter={() => setActiveAgent(agent.id)}
                      onMouseLeave={() => setActiveAgent(null)}
                      style={{ cursor: "pointer", transition: "all 0.2s" }} />
                    {agent.label.split("\n").map((line, li) => (
                      <text key={li} x={nx} y={ny - 3 + li * 9} textAnchor="middle" dominantBaseline="middle"
                        fill={isAct ? agent.color : "rgba(200,200,240,0.55)"} fontSize="6.5"
                        fontFamily="JetBrains Mono" style={{ cursor: "pointer", transition: "fill 0.2s" }}
                        onMouseEnter={() => setActiveAgent(agent.id)}
                        onMouseLeave={() => setActiveAgent(null)}>
                        {line}
                      </text>
                    ))}
                  </g>
                )
              })}

              {/* Orchestrator */}
              <circle cx="200" cy="200" r="45" fill="url(#orch-g)" stroke="rgba(124,58,237,0.5)" strokeWidth="1.5" />
              <circle cx="200" cy="200" r="35" fill="rgba(124,58,237,0.2)" />
              <text x="200" y="196" textAnchor="middle" fill="white" fontSize="8" fontFamily="JetBrains Mono" fontWeight="700">Agentic AI</text>
              <text x="200" y="207" textAnchor="middle" fill="#a78bfa" fontSize="7" fontFamily="JetBrains Mono">Orchestrator</text>
            </svg>
          </div>
        </div>

        {activeAgent && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-4">
            <span className="tag-chip">{agents.find(a => a.id === activeAgent)?.label.replace("\n", " ")} — active</span>
          </motion.div>
        )}
      </div>
    </section>
  )
}
