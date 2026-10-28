import pytest
from fastapi.testclient import TestClient

from app import main
from app.routers import analysis as analysis_router
from app.schemas import RepositoryAnalysis
from app.services.config import ConfigurationError
from app.services.github_service import GitHubAPIError, RepositoryNotFoundError


def test_extension_analyze_request_and_response(monkeypatch):
    received_urls = []

    class FakeGitHubService:
        async def analyze_repository(self, repository_url):
            received_urls.append(repository_url)
            return RepositoryAnalysis(
                name="hello-world",
                owner="octocat",
                description="Example",
                default_branch="main",
                stars=12,
                forks=3,
                repository_size=64,
                languages={"Python": 100},
            )

    monkeypatch.setattr(analysis_router, "GitHubService", FakeGitHubService)
    client = TestClient(main.create_app())
    response = client.post(
        "/analyze",
        json={"repository_url": "https://github.com/octocat/hello-world"},
    )

    assert response.status_code == 200
    assert received_urls == ["https://github.com/octocat/hello-world"]
    assert response.json()["name"] == "hello-world"
    assert response.json()["owner"] == "octocat"
    assert response.json()["source_files"] == []


def test_extension_analyze_rejects_invalid_repository_url():
    client = TestClient(main.create_app())

    response = client.post("/analyze", json={"repository_url": "https://github.com/octocat"})

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("service_error", "expected_status", "expected_detail"),
    [
        (RepositoryNotFoundError(), 404, "GitHub repository not found"),
        (GitHubAPIError(), 502, "Unable to retrieve repository information from GitHub"),
        (ConfigurationError("GITHUB_TOKEN is not configured"), 500, "GitHub token is not configured"),
    ],
)
def test_extension_analyze_maps_backend_errors(
    monkeypatch,
    service_error,
    expected_status,
    expected_detail,
):
    class FailingGitHubService:
        async def analyze_repository(self, repository_url):
            raise service_error

    monkeypatch.setattr(analysis_router, "GitHubService", FailingGitHubService)
    client = TestClient(main.create_app())

    response = client.post(
        "/analyze",
        json={"repository_url": "https://github.com/octocat/hello-world"},
    )

    assert response.status_code == expected_status
    assert response.json()["detail"] == expected_detail


def test_extension_origin_is_allowed_only_when_configured(monkeypatch):
    extension_origin = "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    monkeypatch.setenv("REPOMIND_CORS_ORIGINS", extension_origin)
    client = TestClient(main.create_app())

    response = client.options(
        "/analyze",
        headers={
            "Origin": extension_origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == extension_origin
    assert "access-control-allow-credentials" not in response.headers
