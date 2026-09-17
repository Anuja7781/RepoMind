import base64

import httpx
import pytest

from app.schemas import ASTAnalysis, SourceFile
from app.services.ast_parser import ASTParser
from app.services.config import ConfigurationError
from app.services.dependency_analyzer import DependencyAnalyzer
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
    def __init__(self, headers=None):
        self.calls = []
        self.headers = headers

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
                        {"path": "src/helpers.py", "type": "blob", "size": 120},
                        {"path": "venv/lib.py", "type": "blob", "size": 120},
                        {"path": "src/logic.js", "type": "blob", "size": 260},
                        {"path": "image.png", "type": "blob", "size": 1000},
                        {"path": "notebook.ipynb", "type": "blob", "size": 500},
                    ]
                },
            )

        if url.endswith("/repos/octocat/hello-world/contents/src%2Fapp.py"):
            content = base64.b64encode(
                b"from src.helpers import greet\nprint(greet('hello'))\n"
            ).decode("utf-8")
            return MockResponse(
                200,
                {"type": "file", "encoding": "base64", "content": content},
            )

        if url.endswith("/repos/octocat/hello-world/contents/src%2Fhelpers.py"):
            content = base64.b64encode(
                b"def greet(value):\n    return value\n"
            ).decode("utf-8")
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

    github_service_module.get_github_token = lambda: "test-token"
    github_service_module.httpx.AsyncClient = (
        lambda *args, **kwargs: MockClient(headers=kwargs["headers"])
    )

    result = await GitHubService().analyze_repository("https://github.com/octocat/hello-world")

    assert result.name == "hello-world"
    assert result.default_branch == "main"
    assert result.model_dump()["structure"] == [
        {"path": "README.md", "type": "blob", "size": 123},
        {"path": "src", "type": "tree", "size": None},
        {"path": "src/app.py", "type": "blob", "size": 456},
        {"path": "src/helpers.py", "type": "blob", "size": 120},
        {"path": "venv/lib.py", "type": "blob", "size": 120},
        {"path": "src/logic.js", "type": "blob", "size": 260},
        {"path": "image.png", "type": "blob", "size": 1000},
        {"path": "notebook.ipynb", "type": "blob", "size": 500},
    ]
    assert result.model_dump()["source_files"] == [
        {
            "path": "src/app.py",
            "language": "python",
            "content": "from src.helpers import greet\nprint(greet('hello'))\n",
        },
        {
            "path": "src/helpers.py",
            "language": "python",
            "content": "def greet(value):\n    return value\n",
        },
        {"path": "src/logic.js", "language": "javascript", "content": "console.log('hi');\n"},
    ]
    assert result.model_dump()["ast_analysis"] == [
        {
            "path": "src/app.py",
            "language": "python",
            "imports": ["src.helpers.greet"],
            "classes": [],
            "functions": [],
        },
        {
            "path": "src/helpers.py",
            "language": "python",
            "imports": [],
            "classes": [],
            "functions": ["greet"],
        },
    ]
    assert all(
        "venv/" not in item["path"]
        for item in result.model_dump()["source_files"]
    )
    assert all(
        "venv/" not in item["path"]
        for item in result.model_dump()["ast_analysis"]
    )
    assert result.model_dump()["dependency_analysis"] == [
        {
            "source_file": "src/app.py",
            "target_module": "src.helpers",
        }
    ]
    assert mock_client.headers is None


def test_ast_parser_extracts_python_symbols_and_handles_invalid_syntax():
    parser = ASTParser()

    analysis = parser.analyze_source_file(
        SourceFile(
            path="app.py",
            language="python",
            content=(
                "import fastapi\n"
                "from app.routers import analysis\n"
                "class Service:\n"
                "    async def run(self):\n"
                "        pass\n"
                "def root():\n"
                "    pass\n"
            ),
        )
    )

    assert analysis is not None
    assert analysis.imports == ["fastapi", "app.routers.analysis"]
    assert analysis.classes == ["Service"]
    assert set(analysis.functions) == {"run", "root"}

    invalid_analysis = parser.analyze_source_file(
        SourceFile(path="broken.py", language="python", content="def broken(:\n")
    )

    assert invalid_analysis is not None
    assert invalid_analysis.model_dump() == {
        "path": "broken.py",
        "language": "python",
        "imports": [],
        "classes": [],
        "functions": [],
    }


def test_dependency_analyzer_resolves_internal_modules_only():
    dependencies = DependencyAnalyzer().analyze(
        [
            ASTAnalysis(
                path="app/main.py",
                language="python",
                imports=["fastapi", "app.routers.analysis", "numpy"],
            ),
            ASTAnalysis(
                path="app/routers/analysis.py",
                language="python",
                imports=["app.services.github_service", "missing.module"],
            ),
            ASTAnalysis(
                path="app/services/github_service.py",
                language="python",
            ),
        ]
    )

    assert [dependency.model_dump() for dependency in dependencies] == [
        {
            "source_file": "app/main.py",
            "target_module": "app.routers.analysis",
        },
        {
            "source_file": "app/routers/analysis.py",
            "target_module": "app.services.github_service",
        },
    ]


def test_dependency_analyzer_resolves_modules_inside_backend():
    dependencies = DependencyAnalyzer().analyze(
        [
            ASTAnalysis(
                path="backend/app/main.py",
                language="python",
                imports=[
                    "app.routers.analysis",
                    "app.services.github_service",
                    "httpx",
                ],
            ),
            ASTAnalysis(
                path="backend/app/routers/analysis.py",
                language="python",
                imports=["app.services.github_service"],
            ),
            ASTAnalysis(
                path="backend/app/services/github_service.py",
                language="python",
            ),
        ]
    )

    assert [dependency.model_dump() for dependency in dependencies] == [
        {
            "source_file": "backend/app/main.py",
            "target_module": "app.routers.analysis",
        },
        {
            "source_file": "backend/app/main.py",
            "target_module": "app.services.github_service",
        },
        {
            "source_file": "backend/app/routers/analysis.py",
            "target_module": "app.services.github_service",
        },
    ]


def test_dependency_analyzer_resolves_package_init_modules():
    dependencies = DependencyAnalyzer().analyze(
        [
            ASTAnalysis(
                path="backend/app/main.py",
                language="python",
                imports=["app.services", "app.services.config"],
            ),
            ASTAnalysis(
                path="backend/app/services/__init__.py",
                language="python",
            ),
            ASTAnalysis(
                path="backend/app/services/config.py",
                language="python",
            ),
        ]
    )

    assert [dependency.model_dump() for dependency in dependencies] == [
        {
            "source_file": "backend/app/main.py",
            "target_module": "app.services",
        },
        {
            "source_file": "backend/app/main.py",
            "target_module": "app.services.config",
        },
    ]
