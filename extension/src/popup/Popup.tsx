import { useEffect, useRef, useState } from "react"
import {
  AnalysisApiError,
  analyzeRepository,
  clearLatestAnalysis,
  createAnalysisTransfer,
  getLatestAnalysisTransferId,
  saveAnalysisForDashboard,
} from "../shared/analysisApi"
import { getRepositoryUrlFromPage } from "../shared/repository"

type PopupState =
  | { status: "loading" }
  | { status: "repository"; url: string }
  | { status: "unsupported" }
  | { status: "unavailable" }

export default function Popup() {
  const [page, setPage] = useState<PopupState>({ status: "loading" })
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "warning"; message: string } | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [transferId, setTransferId] = useState<string | null>(null)
  const requestInFlight = useRef(false)

  useEffect(() => {
    let active = true

    void chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => {
        if (!active) return
        const repositoryUrl = tab?.url
          ? getRepositoryUrlFromPage(tab.url)
          : null
        setPage(
          repositoryUrl
            ? { status: "repository", url: repositoryUrl }
            : { status: "unsupported" },
        )
      })
      .catch((error: unknown) => {
        console.error("Could not read the active tab.", error)
        if (active) setPage({ status: "unavailable" })
      })

    return () => {
      active = false
    }
  }, [])

  const repositoryUrl = page.status === "repository" ? page.url : null
  const DASHBOARD_BASE_URL = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:8443"

  async function handleAnalyzeClick() {
    if (!repositoryUrl || requestInFlight.current) return

    requestInFlight.current = true
    setIsAnalyzing(true)
    setNotice(null)
    setTransferId(null)
    try {
      await clearLatestAnalysis()
    } catch (error) {
      console.error("Could not clear the previous dashboard result reference.", error)
    }
    try {
      const analysis = await analyzeRepository(repositoryUrl)
      const transfer = await createAnalysisTransfer(analysis)
      setTransferId(transfer.result_id)
      try {
        await saveAnalysisForDashboard(repositoryUrl, analysis, transfer.result_id)
        setNotice({
          kind: "success",
          message: `Analysis complete for ${analysis.owner}/${analysis.name} (${analysis.source_files_count} source files). Dashboard link expires in ${Math.ceil(transfer.expires_in_seconds / 60)} minutes.`,
        })
      } catch (error) {
        console.error("Analysis transfer succeeded, but its session reference could not be saved.", error)
        setNotice({
          kind: "warning",
          message: `Analysis completed for ${analysis.owner}/${analysis.name}. Open the dashboard now; the link may not be available if the popup is closed.`,
        })
      }
    } catch (error) {
      const message = error instanceof AnalysisApiError
        ? error.message
        : "Repository analysis failed unexpectedly. Please try again."
      if (!(error instanceof AnalysisApiError)) {
        console.error("Repository analysis failed unexpectedly.", error)
      }
      setNotice({ kind: "error", message })
    } finally {
      requestInFlight.current = false
      setIsAnalyzing(false)
    }
  }

  async function handleOpenDashboard() {
    if (!transferId) return

    const dashboardUrl = new URL(DASHBOARD_BASE_URL)
    dashboardUrl.searchParams.set("analysisResult", transferId)
    try {
      await chrome.tabs.create({ url: dashboardUrl.toString() })
    } catch (error) {
      console.error("Could not open the RepoMind dashboard.", error)
      setNotice({ kind: "error", message: "Could not open the dashboard. Check Chrome tab permissions and try again." })
    }
  }

  useEffect(() => {
    let active = true
    void getLatestAnalysisTransferId()
      .then(resultId => {
        if (active) setTransferId(resultId)
      })
      .catch((error: unknown) => console.error("Could not read the dashboard result reference.", error))
    return () => {
      active = false
    }
  }, [])

  return (
    <main className="popup">
      <header className="brand">
        <img className="brand-icon" src="icons/repomind.svg" alt="" />
        <div>
          <p className="eyebrow">REPOSITORY INTELLIGENCE</p>
          <h1>RepoMind <span>AI</span></h1>
        </div>
      </header>

      <p className="description">
        Understand any codebase, starting right where you browse.
      </p>

      <section className="repository-card" aria-live="polite">
        <div className="card-heading">
          <span className={`status-dot ${repositoryUrl ? "is-ready" : ""}`} />
          <span>{page.status === "loading" ? "Checking this page" : repositoryUrl ? "Repository detected" : "No repository detected"}</span>
        </div>

        {repositoryUrl ? (
          <p className="repository-url" title={repositoryUrl}>{repositoryUrl}</p>
        ) : (
          <p className="helper-text">
            {page.status === "loading"
              ? "Looking for an open GitHub repository…"
              : page.status === "unavailable"
                ? "This tab’s address is unavailable. Open a GitHub repository and try again."
                : "Open a repository on github.com to get started. Files, folders, and repository pages are supported."}
          </p>
        )}
      </section>

      <button
        className="analyze-button"
        type="button"
        disabled={!repositoryUrl || isAnalyzing}
        aria-busy={isAnalyzing}
        onClick={() => void handleAnalyzeClick()}
      >
        {isAnalyzing ? "Analyzing Repository…" : "Analyze Repository"}
        <span aria-hidden="true">{isAnalyzing ? <span className="spinner" /> : "→"}</span>
      </button>

      {notice && <p className={`notice is-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>{notice.message}</p>}
      {transferId && !isAnalyzing && (
        <button className="dashboard-button" type="button" onClick={() => void handleOpenDashboard()}>
          Open Dashboard
          <span aria-hidden="true">↗</span>
        </button>
      )}

      <footer>
        <span className="footer-mark" />
        <span>RepoMind · Repository analysis</span>
      </footer>
    </main>
  )
}
