import base64

import httpx
import pytest

from app.schemas import ASTAnalysis, ClassAnalysis, DependencyAnalysis, FunctionAnalysis, SourceFile
from app.services.architecture_analyzer import ArchitectureAnalyzer
from app.services.ast_parser import ASTParser
from app.services.config import ConfigurationError
from app.services.dependency_analyzer import DependencyAnalyzer
from app.services.dependency_graph import build_dependency_graph
from app.services.entity_graph import build_entity_graph
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
            "function_details": [],
            "class_details": [],
        },
        {
            "path": "src/helpers.py",
            "language": "python",
            "imports": [],
            "classes": [],
            "functions": ["greet"],
            "function_details": [
                {
                    "name": "greet",
                    "path": "src/helpers.py",
                    "line_number": 1,
                    "parameters": ["value"],
                }
            ],
            "class_details": [],
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
    assert result.model_dump()["dependency_graph"] == {
        "nodes": [
            {
                "id": "src/app.py",
                "label": "src/app.py",
                "node_type": "file",
            },
            {
                "id": "src/helpers.py",
                "label": "src/helpers.py",
                "node_type": "file",
            },
        ],
        "edges": [
            {
                "source": "src/app.py",
                "target": "src/helpers.py",
                "relationship": "depends_on",
            }
        ],
    }
    assert result.model_dump()["entity_graph"] == {
        "nodes": [
            {
                "id": "file:src/app.py",
                "label": "app.py",
                "node_type": "file",
            },
            {
                "id": "module:src.app",
                "label": "src.app",
                "node_type": "module",
            },
            {
                "id": "file:src/helpers.py",
                "label": "helpers.py",
                "node_type": "file",
            },
            {
                "id": "module:src.helpers",
                "label": "src.helpers",
                "node_type": "module",
            },
            {
                "id": "function:src/helpers.py:greet:1",
                "label": "greet",
                "node_type": "function",
            },
        ],
        "edges": [
            {
                "source": "file:src/app.py",
                "target": "module:src.app",
                "relationship": "contains",
            },
            {
                "source": "file:src/helpers.py",
                "target": "module:src.helpers",
                "relationship": "contains",
            },
            {
                "source": "module:src.helpers",
                "target": "function:src/helpers.py:greet:1",
                "relationship": "defines",
            },
        ],
    }
    assert result.model_dump()["architecture_analysis"] == {
        "components": [
            {
                "name": "application",
                "component_type": "Application",
                "files": ["src/app.py"],
            }
        ],
        "relationships": [
            {
                "source_file": "src/app.py",
                "target_module": "src.helpers",
            }
        ],
    }
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
    assert [function.model_dump() for function in analysis.function_details] == [
        {
            "name": "root",
            "path": "app.py",
            "line_number": 6,
            "parameters": [],
        }
    ]
    assert [class_analysis.model_dump() for class_analysis in analysis.class_details] == [
        {
            "name": "Service",
            "path": "app.py",
            "line_number": 3,
            "methods": [
                {
                    "name": "run",
                    "path": "app.py",
                    "line_number": 4,
                    "parameters": ["self"],
                }
            ],
        }
    ]

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
        "function_details": [],
        "class_details": [],
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


def test_dependency_graph_creates_source_and_target_nodes():
    graph = build_dependency_graph(
        [
            DependencyAnalysis(
                source_file="app/main.py",
                target_module="app.services.users",
            )
        ],
        [
            ASTAnalysis(path="app/main.py", language="python"),
            ASTAnalysis(path="app/services/users.py", language="python"),
        ],
    )

    assert [node.model_dump() for node in graph.nodes] == [
        {
            "id": "app/main.py",
            "label": "app/main.py",
            "node_type": "file",
        },
        {
            "id": "app/services/users.py",
            "label": "app/services/users.py",
            "node_type": "file",
        },
    ]


def test_dependency_graph_creates_depends_on_edges():
    graph = build_dependency_graph(
        [
            DependencyAnalysis(
                source_file="app/main.py",
                target_module="app.services.users",
            )
        ],
        [
            ASTAnalysis(path="app/main.py", language="python"),
            ASTAnalysis(path="app/services/users.py", language="python"),
        ],
    )

    assert [edge.model_dump() for edge in graph.edges] == [
        {
            "source": "app/main.py",
                "target": "app/services/users.py",
            "relationship": "depends_on",
        }
    ]


def test_dependency_graph_prevents_duplicate_nodes_and_edges():
    dependency = DependencyAnalysis(
        source_file="app/main.py",
        target_module="app.services.users",
    )

    graph = build_dependency_graph(
        [dependency, dependency],
        [
            ASTAnalysis(path="app/main.py", language="python"),
            ASTAnalysis(path="app/services/users.py", language="python"),
        ],
    )

    assert len(graph.nodes) == 2
    assert len(graph.edges) == 1


def test_entity_graph_extracts_files_modules_functions_classes_and_methods():
    graph = build_entity_graph(
        [
            ASTAnalysis(
                path="app/services/users.py",
                language="python",
                function_details=[
                    FunctionAnalysis(
                        name="build_user",
                        path="app/services/users.py",
                        line_number=8,
                    )
                ],
                class_details=[
                    ClassAnalysis(
                        name="UserService",
                        path="app/services/users.py",
                        line_number=12,
                        methods=[
                            FunctionAnalysis(
                                name="get_user",
                                path="app/services/users.py",
                                line_number=13,
                            )
                        ],
                    )
                ],
            )
        ]
    )

    assert [node.model_dump() for node in graph.nodes] == [
        {
            "id": "file:app/services/users.py",
            "label": "users.py",
            "node_type": "file",
        },
        {
            "id": "module:app.services.users",
            "label": "app.services.users",
            "node_type": "module",
        },
        {
            "id": "function:app/services/users.py:build_user:8",
            "label": "build_user",
            "node_type": "function",
        },
        {
            "id": "class:app/services/users.py:UserService:12",
            "label": "UserService",
            "node_type": "class",
        },
        {
            "id": "method:app/services/users.py:UserService.get_user:13",
            "label": "get_user",
            "node_type": "method",
        },
    ]
    assert [edge.model_dump() for edge in graph.edges] == [
        {
            "source": "file:app/services/users.py",
            "target": "module:app.services.users",
            "relationship": "contains",
        },
        {
            "source": "module:app.services.users",
            "target": "function:app/services/users.py:build_user:8",
            "relationship": "defines",
        },
        {
            "source": "module:app.services.users",
            "target": "class:app/services/users.py:UserService:12",
            "relationship": "defines",
        },
        {
            "source": "class:app/services/users.py:UserService:12",
            "target": "method:app/services/users.py:UserService.get_user:13",
            "relationship": "has_method",
        },
    ]


def test_entity_graph_handles_init_modules_and_duplicate_entities():
    analysis = ASTAnalysis(
        path="backend/app/services/__init__.py",
        language="python",
        function_details=[
            FunctionAnalysis(
                name="configure",
                path="backend/app/services/__init__.py",
                line_number=2,
            )
        ],
    )

    graph = build_entity_graph([analysis, analysis])

    assert [node.id for node in graph.nodes] == [
        "file:backend/app/services/__init__.py",
        "module:backend.app.services",
        "function:backend/app/services/__init__.py:configure:2",
    ]
    assert len(graph.edges) == 2


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


def test_architecture_analyzer_detects_components_and_relationships():
    dependencies = [
        DependencyAnalysis(
            source_file="app/routes/api.py",
            target_module="app.services.users",
        )
    ]

    architecture = ArchitectureAnalyzer().analyze(
        [
            ASTAnalysis(path="app/routes/api.py", language="python"),
            ASTAnalysis(path="app/models/user.py", language="python"),
            ASTAnalysis(path="app/services/users.py", language="python"),
            ASTAnalysis(path="app/utlis/formatters.py", language="python"),
            ASTAnalysis(path="config.py", language="python"),
            ASTAnalysis(path="app.py", language="python"),
            ASTAnalysis(path="app/main.py", language="python"),
            ASTAnalysis(path="venv/routes/ignored.py", language="python"),
            ASTAnalysis(path="site-packages/models/ignored.py", language="python"),
        ],
        dependencies,
    )

    assert [component.model_dump() for component in architecture.components] == [
        {
            "name": "routes",
            "component_type": "Routes",
            "files": ["app/routes/api.py"],
        },
        {
            "name": "models",
            "component_type": "Models",
            "files": ["app/models/user.py"],
        },
        {
            "name": "services",
            "component_type": "Services",
            "files": ["app/services/users.py"],
        },
        {
            "name": "utlis",
            "component_type": "Utilities",
            "files": ["app/utlis/formatters.py"],
        },
        {
            "name": "config",
            "component_type": "Configuration",
            "files": ["config.py"],
        },
        {
            "name": "application",
            "component_type": "Application",
            "files": ["app.py", "app/main.py"],
        },
    ]
    assert architecture.relationships == dependencies
