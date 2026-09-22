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
    name: str
    component_type: str
    files: list[str] = Field(default_factory=list)


class ArchitectureAnalysis(BaseModel):
    components: list[ArchitectureComponent] = Field(default_factory=list)
    relationships: list[DependencyAnalysis] = Field(default_factory=list)


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