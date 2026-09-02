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