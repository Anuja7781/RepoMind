from typing import Literal

from pydantic import BaseModel, Field


AIStatus = Literal["completed", "unavailable", "error"]


class AIAnalysisOutput(BaseModel):
    provider: str
    model: str
    status: AIStatus
    repository_summary: str
    purpose: str
    project_type: str
    functionalities: list[str] = Field(default_factory=list)
    technology_stack: list[str] = Field(default_factory=list)
    architecture_summary: str
    architecture_pattern: str
    entry_points: list[str] = Field(default_factory=list)
    security_summary: str
    security_priorities: list[str] = Field(default_factory=list)
    bug_risk_summary: str
    high_risk_areas: list[str] = Field(default_factory=list)
    code_quality_summary: str
    documentation_summary: str
    key_findings: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    installation: list[str] = Field(default_factory=list)
    usage: list[str] = Field(default_factory=list)
    important_files: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    executive_summary: str
    fallback_message: str | None = None
    error_code: str | None = None
    error_message: str | None = None


class AIReasonRequest(BaseModel):
    analysis: dict
    agent_summary: dict = Field(default_factory=dict)


class AIReasonResponse(AIAnalysisOutput):
    pass


class ProviderMetadata(BaseModel):
    provider: str
    model: str


class AIProviderError(Exception):
    def __init__(self, code: str, message: str, provider: str, model: str):
        super().__init__(message)
        self.code = code
        self.message = message
        self.provider = provider
        self.model = model


class AIUnavailableError(Exception):
    def __init__(self, attempts: list[str]):
        super().__init__("No configured AI provider could complete the reasoning request.")
        self.attempts = attempts
