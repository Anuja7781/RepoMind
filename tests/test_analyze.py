import base64

import httpx
import pytest

from app.services.github_service import GitHubService


class MockResponse:
    def __init__(self, status_code: int, payload):
        self.status_code = status_code
        self._payload = payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                "GitHub request failed",
                request=httpx.Request("GET", "https://example.com"),
                response=httpx.Response(self.status_code, request=httpx.Request("GET", "https://example.com")),
            )

    def json(self):
        return self._payload


class MockClient:
    def __init__(self):
        self.calls = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def get(self, url):
        self.calls.append(url)

        if url.endswith("/repos/octocat/hello-world"):
            return MockResponse(
                200,
                {
                    "name": "hello-world",
                    "owner": {"login": "octocat"},
                    "description": "Test repo",
                    "default_branch": "main",
                    "stargazers_count": 42,
                    "forks_count": 7,
                    "size": 128,
                },
            )

        if url.endswith("/repos/octocat/hello-world/languages"):
            return MockResponse(200, {"Python": 100})

        if url.endswith("/repos/octocat/hello-world/git/trees/main?recursive=1"):
            return MockResponse(
                200,
                {
                    "tree": [
                        {"path": "README.md", "type": "blob", "size": 123},
                        {"path": "src", "type": "tree"},
                        {"path": "src/app.py", "type": "blob", "size": 456},
                        {"path": "src/logic.js", "type": "blob", "size": 260},
                        {"path": "image.png", "type": "blob", "size": 1000},
                        {"path": "notebook.ipynb", "type": "blob", "size": 500},
                    ]
                },
            )

        if url.endswith("/repos/octocat/hello-world/contents/src%2Fapp.py"):
            content = base64.b64encode(b"print('hello from python')\n").decode("utf-8")
            return MockResponse(
                200,
                {"type": "file", "encoding": "base64", "content": content},
            )

        if url.endswith("/repos/octocat/hello-world/contents/src%2Flogic.js"):
            content = base64.b64encode(b"console.log('hi');\n").decode("utf-8")
            return MockResponse(
                200,
                {"type": "file", "encoding": "base64", "content": content},
            )

        raise AssertionError(f"Unexpected URL: {url}")


@pytest.mark.asyncio
async def test_analyze_repository_includes_structure_and_source_files():
    mock_client = MockClient()

    import app.services.github_service as github_service_module

    github_service_module.httpx.AsyncClient = lambda *args, **kwargs: mock_client

    result = await GitHubService().analyze_repository("https://github.com/octocat/hello-world")

    assert result.name == "hello-world"
    assert result.default_branch == "main"
    assert result.model_dump()["structure"] == [
        {"path": "README.md", "type": "blob", "size": 123},
        {"path": "src", "type": "tree", "size": None},
        {"path": "src/app.py", "type": "blob", "size": 456},
        {"path": "src/logic.js", "type": "blob", "size": 260},
        {"path": "image.png", "type": "blob", "size": 1000},
        {"path": "notebook.ipynb", "type": "blob", "size": 500},
    ]
    assert result.model_dump()["source_files"] == [
        {"path": "src/app.py", "language": "python", "content": "print('hello from python')\n"},
        {"path": "src/logic.js", "language": "javascript", "content": "console.log('hi');\n"},
    ]
