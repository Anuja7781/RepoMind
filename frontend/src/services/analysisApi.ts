export interface AnalyzeRequest {
  repository_url: string
}

export interface RepositoryStructureItem {
  path: string
  type: string
  size: number | null
}

export interface SourceFile {
  path: string
  language: string
  content: string
}

export interface FunctionAnalysis {
  name: string
  path: string
  line_number: number
  parameters: string[]
}

export interface ClassAnalysis {
  name: string
  path: string
  line_number: number
  methods: FunctionAnalysis[]
}

export interface ASTAnalysis {
  path: string
  language: string
  imports: string[]
  classes: string[]
  functions: string[]
  function_details: FunctionAnalysis[]
  class_details: ClassAnalysis[]
}

export interface DependencyAnalysis {
  source_file: string
  target_module: string
}

export interface GraphNode {
  id: string
  label: string
  node_type: string
}

export interface GraphEdge {
  source: string
  target: string
  relationship: string
}

export interface DependencyGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface EntityGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface ArchitectureComponent {
  id?: string | null
  name: string
  component_type: string
  files: string[]
  source_file_count: number
  representative_path: string | null
  confidence: string
}

export interface ArchitectureRelationship {
  source?: string | null
  target?: string | null
  source_component: string
  target_component: string
  relationship_type: string
  label: string
  evidence_count: number
  evidence: DependencyAnalysis[]
  confidence: string
  supporting_files: string[]
}

export interface ArchitectureAnalysis {
  components: ArchitectureComponent[]
  relationships: ArchitectureRelationship[]
  architecture_pattern: string
  confidence: string
  entry_point: string | null
  primary_language: string | null
  description: string
  evidence: string[]
  architecture_basis: string
  documentation_available: boolean
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
  ast_analysis: ASTAnalysis[]
  dependency_analysis: DependencyAnalysis[]
  dependency_graph: DependencyGraph
  entity_graph: EntityGraph
  architecture_analysis: ArchitectureAnalysis
  security_analysis: SecurityAnalysis
  metrics: MetricsAnalysis | null
  documentation_analysis: DocumentationAnalysis | null
}

export interface SecurityFinding {
  id: string
  severity: "critical" | "high" | "medium" | "low"
  category: string
  title: string
  file: string
  line: number | null
  evidence: string
  description: string
  recommendation: string
  confidence: "high" | "medium" | "low"
}

export interface SecurityAnalysis {
  summary: string
  findings: SecurityFinding[]
  total_findings: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  files_scanned: number
  rules_triggered: string[]
}

export interface MetricsAnalysis {
  total_repository_items: number
  source_files: number
  ast_analyzed_files: number
  dependency_edges: number
  entity_nodes: number
  entity_relationships: number
  architecture_components: number
  architecture_relationships: number
  language_file_counts: Record<string, number>
  file_type_counts: Record<string, number>
  directory_count: number
  total_functions: number
  total_classes: number
  total_methods: number
  total_imports: number
  ast_coverage_percent: number | null
  dependency_density: number | null
  average_entity_degree: number | null
  architecture_connectivity: number | null
  stars: number
  forks: number
  repository_size: number
  default_branch: string
  owner: string
  name: string
}

export interface DocumentationSection {
  total: number
  documented: number
  coverage: number | null
}

export interface DocumentationAnalysis {
  source_files: number
  ast_files: number
  ast_coverage_percent: number | null
  readme: { exists: boolean; lines: number | null; word_count: number | null }
  documentation_files: number
  functions: DocumentationSection
  classes: DocumentationSection
  methods: DocumentationSection
  todo_count: number
  fixme_count: number
  source_comment_lines: number
}

export class AnalysisApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'AnalysisApiError'
  }
}

function getDetailMessage(detail: unknown): string | null {
  if (typeof detail === 'string') return detail
  if (!Array.isArray(detail)) return null

  const messages = detail.map(item => {
    if (typeof item === 'string') return item
    if (item && typeof item === 'object' && 'msg' in item && typeof item.msg === 'string') return item.msg
    return null
  }).filter((message): message is string => Boolean(message))

  return messages.length > 0 ? messages.join(' ') : null
}

export async function analyzeRepository(repositoryUrl: string): Promise<RepositoryAnalysis> {
  const trimmedUrl = repositoryUrl.trim()
  if (!/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(trimmedUrl)) {
    throw new AnalysisApiError('Invalid GitHub repository URL.', 422)
  }

  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repository_url: trimmedUrl } satisfies AnalyzeRequest),
    })
  } catch {
    throw new Error('Backend server is not reachable. Make sure FastAPI is running on port 8000.')
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload && typeof payload === 'object' && 'detail' in payload
      ? getDetailMessage(payload.detail)
      : null

    if (response.status === 404) throw new AnalysisApiError('Repository could not be found.', response.status)
    if (response.status === 422) throw new AnalysisApiError(detail ?? 'Invalid GitHub repository URL.', response.status)
    if (response.status >= 500) throw new AnalysisApiError(detail ?? 'The analysis backend failed to process the repository.', response.status)
    throw new AnalysisApiError(detail ?? 'Repository analysis failed.', response.status)
  }

  return payload as RepositoryAnalysis
}