import { useState, useCallback } from "react"
import { analyzeRepository, type RepositoryAnalysis } from "@/services/analysisApi"

export type AnalysisState = "idle" | "running" | "complete" | "error"

const ANALYSIS_PHASES = [
  { id: "connect", label: "Connecting to Repository", description: "Sending the repository URL to the analysis backend", duration: 0 },
  { id: "analyze", label: "Analyzing Repository", description: "Parsing the repository and building its analysis model", duration: 0 },
  { id: "load", label: "Loading Repository Intelligence", description: "Preparing the returned repository structure and graphs", duration: 0 },
  { id: "complete", label: "Analysis Complete", description: "The backend analysis is ready to explore", duration: 0 },
] as const

export type AnalysisPhase = (typeof ANALYSIS_PHASES)[number]

export interface AnalysisResult {
  repository: RepositoryAnalysis
  completedAt: string
}

export interface UseAnalysisReturn {
  state: AnalysisState
  phases: ReadonlyArray<AnalysisPhase>
  currentPhase: number
  phaseProgress: number
  result: AnalysisResult | null
  error: string | null
  repoUrl: string
  setRepoUrl: (url: string) => void
  startAnalysis: (repositoryUrl?: string) => Promise<void>
  reset: () => void
}

export function useAnalysis(): UseAnalysisReturn {
  const [repoUrl, setRepoUrl] = useState("https://github.com/vercel/next.js")
  const [state, setState] = useState<AnalysisState>("idle")
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const startAnalysis = useCallback(async (requestedUrl = repoUrl) => {
    setError(null)
    setState("running")
    setCurrentPhase(0)
    setPhaseProgress(25)
    setResult(null)

    try {
      setCurrentPhase(1)
      setPhaseProgress(50)
      const repository = await analyzeRepository(requestedUrl)
      setCurrentPhase(2)
      setPhaseProgress(80)
      setResult({ repository, completedAt: new Date().toLocaleTimeString() })
      setState("complete")
      setCurrentPhase(3)
      setPhaseProgress(100)
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Repository analysis failed.')
      setState("error")
    }
  }, [repoUrl])

  const reset = useCallback(() => {
    setState("idle")
    setCurrentPhase(0)
    setPhaseProgress(0)
    setResult(null)
    setError(null)
  }, [])

  return { state, phases: ANALYSIS_PHASES, currentPhase, phaseProgress, result, error, repoUrl, setRepoUrl, startAnalysis, reset }
}
