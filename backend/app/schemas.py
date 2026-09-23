import re

from pydantic import BaseModel, ConfigDict, Field, field_validator


GITHUB_REPOSITORY_URL = re.compile(
    r"^https://github\.com/[A-Za-z0-9-]+/[A-Za-z0-9_.-]+$"
)


class AnalyzeRequest(BaseModel):
    repository_url: str = Field(..., examples=["https://github.com/fastapi/fastapi"])

    @field_validator("repository_url")
    @classmethod
    def validate_repository_url(cls, value: str) -> str:
        if not GITHUB_REPOSITORY_URL.fullmatch(value):
            raise ValueError(
                "repository_url must match https://github.com/<owner>/<repository>"
            )
        return value


class RepositoryStructureItem(BaseModel):
    path: str
    type: str
    size: int | None = None


class SourceFile(BaseModel):
    path: str
    language: str
    content: str


class FunctionAnalysis(BaseModel):
    name: str
    path: str
    line_number: int
    parameters: list[str] = Field(default_factory=list)


class ClassAnalysis(BaseModel):
    name: str
    path: str
    line_number: int
    methods: list[FunctionAnalysis] = Field(default_factory=list)


class ASTAnalysis(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "path": "app/services/users.py",
                "language": "python",
                "imports": ["app.models.user"],
                "classes": ["UserService"],
                "functions": ["build_user"],
                "function_details": [
                    {
                        "name": "build_user",
                        "path": "app/services/users.py",
                        "line_number": 8,
                        "parameters": ["name"],
                    }
                ],
                "class_details": [
                    {
                        "name": "UserService",
                        "path": "app/services/users.py",
                        "line_number": 12,
                        "methods": [
                            {
                                "name": "get_user",
                                "path": "app/services/users.py",
                                "line_number": 13,
                                "parameters": ["self", "user_id"],
                            }
                        ],
                    }
                ],
            }
        }
    )

    path: str
    language: str
    imports: list[str] = Field(default_factory=list)
    classes: list[str] = Field(default_factory=list)
    functions: list[str] = Field(default_factory=list)
    function_details: list[FunctionAnalysis] = Field(default_factory=list)
    class_details: list[ClassAnalysis] = Field(default_factory=list)


class DependencyAnalysis(BaseModel):
    source_file: str
    target_module: str


class GraphNode(BaseModel):
    id: str
    label: str
    node_type: str


class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: str = "depends_on"


class DependencyGraph(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


class EntityGraph(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


class ArchitectureComponent(BaseModel):
    id: str | None = None
    name: str
    component_type: str
    files: list[str] = Field(default_factory=list)
    source_file_count: int = 0
    representative_path: str | None = None
    confidence: str = "medium"


class ArchitectureRelationship(BaseModel):
    source: str | None = None
    target: str | None = None
    source_component: str
    target_component: str
    relationship_type: str = "imports"
    label: str = "Imports"
    evidence_count: int = 0
    evidence: list[DependencyAnalysis] = Field(default_factory=list)
    confidence: str = "medium"
    supporting_files: list[str] = Field(default_factory=list)


class ArchitectureAnalysis(BaseModel):
    components: list[ArchitectureComponent] = Field(default_factory=list)
    relationships: list[ArchitectureRelationship] = Field(default_factory=list)
    architecture_pattern: str = "Repository structure"
    confidence: str = "low"
    entry_point: str | None = None
    primary_language: str | None = None
    description: str = "Architecture inferred from the analyzed repository evidence."
    evidence: list[str] = Field(default_factory=list)
    architecture_basis: str = "Source-recovered architecture"
    documentation_available: bool = False


class SecurityFinding(BaseModel):
    id: str
    rule: str
    severity: str
    category: str
    title: str
    file: str
    line: int | None = None
    evidence: str
    description: str
    recommendation: str
    confidence: str


class SecurityAnalysis(BaseModel):
    status: str = "completed"
    summary: str = "Static analysis"
    findings: list[SecurityFinding] = Field(default_factory=list)
    total_findings: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    files_scanned: int = 0
    rules_applied: list[str] = Field(default_factory=list)
    rules_triggered: list[str] = Field(default_factory=list)
    files_skipped: int = 0
    skipped_reasons: dict[str, int] = Field(default_factory=dict)


class MetricsAnalysis(BaseModel):
    total_repository_items: int
    source_files: int
    ast_analyzed_files: int
    dependency_edges: int
    entity_nodes: int
    entity_relationships: int
    architecture_components: int
    architecture_relationships: int
    language_file_counts: dict[str, int] = Field(default_factory=dict)
    file_type_counts: dict[str, int] = Field(default_factory=dict)
    directory_count: int
    total_functions: int
    total_classes: int
    total_methods: int
    total_imports: int
    ast_coverage_percent: float | None = None
    dependency_density: float | None = None
    average_entity_degree: float | None = None
    architecture_connectivity: float | None = None
    stars: int
    forks: int
    repository_size: int
    default_branch: str
    owner: str
    name: str


class DocumentationSection(BaseModel):
    total: int
    documented: int
    coverage: float | None = None


class ReadmeAnalysis(BaseModel):
    exists: bool
    lines: int | None = None
    word_count: int | None = None


class DocumentationAnalysis(BaseModel):
    source_files: int
    ast_files: int
    ast_coverage_percent: float | None = None
    readme: ReadmeAnalysis
    documentation_files: int
    functions: DocumentationSection
    classes: DocumentationSection
    methods: DocumentationSection
    todo_count: int
    fixme_count: int
    source_comment_lines: int


class BugRiskFactor(BaseModel):
    name: str
    contribution: int
    signal: str
    value: object | None = None
    available: bool = True


class BugRiskFinding(BaseModel):
    path: str
    score: int
    level: str
    factors: list[str] = Field(default_factory=list)
    explanation: str
    confidence: str
    evidence: dict[str, object] = Field(default_factory=dict)


class BugRiskSummary(BaseModel):
    status: str = "completed"
    total_files_analyzed: int = 0
    files_analyzed: int = 0
    signals_used: list[str] = Field(default_factory=list)
    high_risk_count: int = 0
    medium_risk_count: int = 0
    low_risk_count: int = 0
    critical_count: int = 0
    findings: list[BugRiskFinding] = Field(default_factory=list)


class RepositoryAnalysis(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    owner: str
    description: str | None
    default_branch: str
    stars: int
    forks: int
    repository_size: int
    languages: dict[str, int]
    structure: list[RepositoryStructureItem] = Field(default_factory=list)
    source_files: list[SourceFile] = Field(default_factory=list)
    ast_analysis: list[ASTAnalysis] = Field(default_factory=list)
    dependency_analysis: list[DependencyAnalysis] = Field(default_factory=list)
    dependency_graph: DependencyGraph = Field(default_factory=DependencyGraph)
    entity_graph: EntityGraph = Field(default_factory=EntityGraph)
    architecture_analysis: ArchitectureAnalysis = Field(
        default_factory=ArchitectureAnalysis
    )
    security_analysis: SecurityAnalysis = Field(default_factory=SecurityAnalysis)
    metrics: MetricsAnalysis | None = None
    documentation_analysis: DocumentationAnalysis | None = None
    bug_risk_analysis: BugRiskSummary = Field(default_factory=BugRiskSummary)
    tree_item_count: int = 0
    source_files_count: int = 0
    ast_files_count: int = 0
    source_files_skipped: int = 0
    source_skip_reasons: dict[str, int] = Field(default_factory=dict)