import { useState, useCallback, useRef } from "react"
import { analyzeRepository, retrieveTransferredAnalysis, type RepositoryAnalysis } from "@/services/analysisApi"

export type AnalysisState = "idle" | "running" | "loading-transfer" | "complete" | "error"

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
  loadTransferredAnalysis: (resultId: string) => Promise<void>
  reset: () => void
}

export function useAnalysis(): UseAnalysisReturn {
  const [repoUrl, setRepoUrl] = useState("https://github.com/vercel/next.js")
  const [state, setState] = useState<AnalysisState>("idle")
  const [currentPhase, setCurrentPhase] = useState(0)
  const [phaseProgress, setPhaseProgress] = useState(0)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const requestInFlight = useRef(false)
  const transferLoadsStarted = useRef(new Set<string>())

  const startAnalysis = useCallback(async (requestedUrl = repoUrl) => {
    if (requestInFlight.current) return
    requestInFlight.current = true
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
    } finally {
      requestInFlight.current = false
    }
  }, [repoUrl])

  const loadTransferredAnalysis = useCallback(async (resultId: string) => {
    if (requestInFlight.current || transferLoadsStarted.current.has(resultId)) return
    transferLoadsStarted.current.add(resultId)
    requestInFlight.current = true
    setError(null)
    setState("loading-transfer")
    setCurrentPhase(0)
    setPhaseProgress(35)
    setResult(null)

    try {
      const repository = await retrieveTransferredAnalysis(resultId)
      setRepoUrl(`https://github.com/${repository.owner}/${repository.name}`)
      setResult({ repository, completedAt: new Date().toLocaleTimeString() })
      setCurrentPhase(3)
      setPhaseProgress(100)
      setState("complete")
    } catch (transferError) {
      transferLoadsStarted.current.delete(resultId)
      setError(transferError instanceof Error ? transferError.message : "The transferred repository analysis could not be loaded.")
      setState("error")
    } finally {
      requestInFlight.current = false
    }
  }, [])

  const reset = useCallback(() => {
    if (requestInFlight.current) return
    setState("idle")
    setCurrentPhase(0)
    setPhaseProgress(0)
    setResult(null)
    setError(null)
  }, [])

  return {
    state,
    phases: ANALYSIS_PHASES,
    currentPhase,
    phaseProgress,
    result,
    error,
    repoUrl,
    setRepoUrl,
    startAnalysis,
    loadTransferredAnalysis,
    reset,
  }
}
