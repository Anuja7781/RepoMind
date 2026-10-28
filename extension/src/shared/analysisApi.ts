export interface AnalyzeRequest {
  repository_url: string
}

export interface SourceFile {
  path: string
  language: string
  content: string
}

export interface RepositoryStructureItem {
  path: string
  type: string
  size: number | null
}

export interface SecurityFinding {
  id: string
  rule: string
  severity: string
  category: string
  title: string
  file: string
  line: number | null
  evidence: string
  description: string
  recommendation: string
  confidence: string
}

export interface SecurityAnalysis {
  status: string
  summary: string
  findings: SecurityFinding[]
  total_findings: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  files_scanned: number
  rules_applied: string[]
  rules_triggered: string[]
  files_skipped: number
  skipped_reasons: Record<string, number>
}

export interface RepositoryAnalysis {
  name: string
  owner: string
  description: string | null
  default_branch: string
  stars: number
  forks: number
  repository_size: number
  languages: Record<string, number>
  structure: RepositoryStructureItem[]
  source_files: SourceFile[]
  ast_analysis: Array<Record<string, unknown>>
  dependency_analysis: Array<Record<string, unknown>>
  dependency_graph: Record<string, unknown>
  entity_graph: Record<string, unknown>
  architecture_analysis: Record<string, unknown>
  security_analysis: SecurityAnalysis
  metrics: Record<string, unknown> | null
  documentation_analysis: Record<string, unknown> | null
  bug_risk_analysis: Record<string, unknown>
  tree_item_count: number
  source_files_count: number
  ast_files_count: number
  source_files_skipped: number
  source_skip_reasons: Record<string, number>
}

export type StoredRepositoryAnalysis = Omit<RepositoryAnalysis, "source_files">

export interface StoredAnalysis {
  repository_url: string
  analyzed_at: string
  result_id: string
  analysis: StoredRepositoryAnalysis
}

export interface AnalysisTransfer {
  result_id: string
  expires_in_seconds: number
}

export class AnalysisApiError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid_url" | "connection" | "http" | "unexpected_response",
    readonly status?: number,
  ) {
    super(message)
    this.name = "AnalysisApiError"
  }
}

const REPOSITORY_URL_PATTERN =
  /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")
const LATEST_ANALYSIS_KEY = "repomind.latestAnalysis"
const TRANSFER_ID_PATTERN = /^[A-Za-z0-9_-]{43}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isSourceFile(value: unknown): value is SourceFile {
  return (
    isRecord(value) &&
    typeof value.path === "string" &&
    typeof value.language === "string" &&
    typeof value.content === "string"
  )
}

function isSecurityFinding(value: unknown): value is SecurityFinding {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.evidence === "string"
  )
}

function isRepositoryAnalysis(value: unknown): value is RepositoryAnalysis {
  if (!isRecord(value)) return false

  return (
    typeof value.name === "string" &&
    typeof value.owner === "string" &&
    (typeof value.description === "string" || value.description === null) &&
    typeof value.default_branch === "string" &&
    isRecord(value.languages) &&
    Object.values(value.languages).every(languageSize => typeof languageSize === "number") &&
    Array.isArray(value.structure) &&
    value.structure.every(item =>
      isRecord(item) &&
      typeof item.path === "string" &&
      typeof item.type === "string" &&
      (typeof item.size === "number" || item.size === null),
    ) &&
    Array.isArray(value.source_files) &&
    value.source_files.every(isSourceFile) &&
    Array.isArray(value.ast_analysis) &&
    value.ast_analysis.every(isRecord) &&
    Array.isArray(value.dependency_analysis) &&
    value.dependency_analysis.every(isRecord) &&
    isRecord(value.dependency_graph) &&
    Array.isArray(value.dependency_graph.nodes) &&
    Array.isArray(value.dependency_graph.edges) &&
    isRecord(value.entity_graph) &&
    Array.isArray(value.entity_graph.nodes) &&
    Array.isArray(value.entity_graph.edges) &&
    isRecord(value.architecture_analysis) &&
    isRecord(value.security_analysis) &&
    Array.isArray(value.security_analysis.findings) &&
    value.security_analysis.findings.every(isSecurityFinding) &&
    isRecord(value.bug_risk_analysis) &&
    (value.metrics === null || isRecord(value.metrics)) &&
    (value.documentation_analysis === null || isRecord(value.documentation_analysis)) &&
    typeof value.source_files_count === "number" &&
    typeof value.stars === "number" &&
    typeof value.forks === "number" &&
    typeof value.repository_size === "number" &&
    typeof value.tree_item_count === "number" &&
    typeof value.ast_files_count === "number" &&
    typeof value.source_files_skipped === "number" &&
    isRecord(value.source_skip_reasons) &&
    Object.values(value.source_skip_reasons).every(count => typeof count === "number")
  )
}

function getDetailMessage(payload: unknown): string | null {
  if (!isRecord(payload)) return null
  const detail = payload.detail
  if (typeof detail === "string") return detail
  if (!Array.isArray(detail)) return null

  const messages = detail
    .map(item => isRecord(item) && typeof item.msg === "string" ? item.msg : null)
    .filter((message): message is string => message !== null)
  return messages.length > 0 ? messages.join(" ") : null
}

function getHttpErrorMessage(status: number, detail: string | null): string {
  if (status === 404) return "GitHub could not find this repository, or it is not publicly accessible."
  if (status === 422) return detail ?? "The repository URL was rejected. Open a GitHub repository page and try again."
  if (status === 502) return "GitHub could not be reached or returned an error. Please try again later."
  if (status === 500 && detail?.toLowerCase().includes("token is not configured")) {
    return "The backend is missing its GitHub token. Configure GITHUB_TOKEN in the backend environment."
  }
  if (status >= 500) return "The analysis backend encountered an error. Check its logs and try again."
  return detail ?? `Repository analysis failed (HTTP ${status}).`
}

export async function analyzeRepository(repositoryUrl: string): Promise<RepositoryAnalysis> {
  const trimmedUrl = repositoryUrl.trim()
  if (!REPOSITORY_URL_PATTERN.test(trimmedUrl)) {
    throw new AnalysisApiError("Invalid GitHub repository URL.", "invalid_url", 422)
  }

  let response: Response
  try {
    response = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repository_url: trimmedUrl } satisfies AnalyzeRequest),
    })
  } catch {
    throw new AnalysisApiError(
      `Could not connect to the RepoMind backend at ${BACKEND_URL}. Make sure it is running and that this extension origin is allowed by backend CORS.`,
      "connection",
    )
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    if (response.ok) {
      throw new AnalysisApiError("The backend returned an unreadable response.", "unexpected_response", response.status)
    }
    payload = null
  }

  if (!response.ok) {
    throw new AnalysisApiError(
      getHttpErrorMessage(response.status, getDetailMessage(payload)),
      "http",
      response.status,
    )
  }
  if (!isRepositoryAnalysis(payload)) {
    throw new AnalysisApiError(
      "The backend response did not match the expected repository analysis format.",
      "unexpected_response",
      response.status,
    )
  }

  return payload
}

export async function createAnalysisTransfer(
  analysis: RepositoryAnalysis,
): Promise<AnalysisTransfer> {
  let response: Response
  try {
    response = await fetch(`${BACKEND_URL}/analysis-results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis }),
    })
  } catch {
    throw new AnalysisApiError(
      `The analysis completed, but the backend at ${BACKEND_URL} could not create a dashboard transfer.`,
      "connection",
    )
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    throw new AnalysisApiError(
      `The analysis completed, but the dashboard transfer failed: ${getHttpErrorMessage(response.status, getDetailMessage(payload))}`,
      "http",
      response.status,
    )
  }
  if (
    !isRecord(payload) ||
    typeof payload.result_id !== "string" ||
    !TRANSFER_ID_PATTERN.test(payload.result_id) ||
    typeof payload.expires_in_seconds !== "number"
  ) {
    throw new AnalysisApiError(
      "The backend returned an invalid dashboard transfer reference.",
      "unexpected_response",
      response.status,
    )
  }

  return {
    result_id: payload.result_id,
    expires_in_seconds: payload.expires_in_seconds,
  }
}

export async function saveAnalysisForDashboard(
  repositoryUrl: string,
  analysis: RepositoryAnalysis,
  resultId: string,
): Promise<void> {
  const { source_files: _sourceFiles, ...metadata } = analysis
  const sanitizedAnalysis: StoredRepositoryAnalysis = {
    ...metadata,
    security_analysis: {
      ...metadata.security_analysis,
      findings: metadata.security_analysis.findings.map(finding => ({
        ...finding,
        evidence: "",
      })),
    },
  }
  const storedAnalysis: StoredAnalysis = {
    repository_url: repositoryUrl,
    analyzed_at: new Date().toISOString(),
    result_id: resultId,
    analysis: sanitizedAnalysis,
  }

  await chrome.storage.session.set({ [LATEST_ANALYSIS_KEY]: storedAnalysis })
}

export async function getLatestAnalysisTransferId(): Promise<string | null> {
  const stored = await chrome.storage.session.get(LATEST_ANALYSIS_KEY)
  const value: unknown = stored[LATEST_ANALYSIS_KEY]
  if (!isRecord(value) || typeof value.result_id !== "string" || !TRANSFER_ID_PATTERN.test(value.result_id)) {
    return null
  }
  return value.result_id
}

export async function clearLatestAnalysis(): Promise<void> {
  await chrome.storage.session.remove(LATEST_ANALYSIS_KEY)
}
