import base64
import os
from pathlib import PurePosixPath
from urllib.parse import quote, urlparse

import httpx

from app.schemas import RepositoryAnalysis, RepositoryStructureItem, SourceFile
from app.services.architecture_analyzer import ArchitectureAnalyzer
from app.services.ast_parser import ASTParser
from app.services.config import get_github_token
from app.services.dependency_analyzer import DependencyAnalyzer
from app.services.dependency_graph import build_dependency_graph
from app.services.entity_graph import build_entity_graph


SOURCE_FILE_EXTENSIONS = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".html": "html",
    ".css": "css",
}

MAX_SOURCE_FILES = 50
MAX_SOURCE_BYTES = 250_000
EXCLUDED_SOURCE_DIRECTORIES = {"venv", ".venv", "env", "__pycache__"}


class RepositoryNotFoundError(Exception):
    """Raised when GitHub cannot find the requested repository."""


class GitHubAPIError(Exception):
    """Raised when GitHub cannot be reached or returns an unexpected error."""


class GitHubService:
    api_base_url = "https://api.github.com"

    async def analyze_repository(self, repository_url: str) -> RepositoryAnalysis:
        owner, repository = self._repository_parts(repository_url)
        endpoint = f"{self.api_base_url}/repos/{owner}/{repository}"
        github_token = get_github_token()

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(10.0),
                headers={
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {github_token}",
                },
            ) as client:
                response = await client.get(endpoint)
                if response.status_code == 404:
                    raise RepositoryNotFoundError
                response.raise_for_status()
                repository_data = response.json()

                default_branch = repository_data["default_branch"]

                languages_response = await client.get(f"{endpoint}/languages")
                languages_response.raise_for_status()
                languages = languages_response.json()

                tree_response = await client.get(
                    f"{endpoint}/git/trees/{default_branch}?recursive=1"
                )
                tree_response.raise_for_status()
                tree_data = tree_response.json()

                source_files = await self._fetch_source_files(
                    client,
                    endpoint,
                    tree_data.get("tree", []),
                )
        except RepositoryNotFoundError:
            raise
        except (httpx.HTTPError, ValueError) as error:
            raise GitHubAPIError("GitHub API request failed") from error

        structure = [
            RepositoryStructureItem(
                path=item.get("path", ""),
                type=item.get("type", "unknown"),
                size=item.get("size"),
            )
            for item in tree_data.get("tree", [])
        ]
        ast_parser = ASTParser()
        ast_analysis = [
            analysis
            for source_file in source_files
            if (analysis := ast_parser.analyze_source_file(source_file)) is not None
        ]
        dependency_analysis = DependencyAnalyzer().analyze(ast_analysis)

        return RepositoryAnalysis(
            name=repository_data["name"],
            owner=repository_data["owner"]["login"],
            description=repository_data.get("description"),
            default_branch=default_branch,
            stars=repository_data["stargazers_count"],
            forks=repository_data["forks_count"],
            repository_size=repository_data["size"],
            languages=languages,
            structure=structure,
            source_files=source_files,
            ast_analysis=ast_analysis,
            dependency_analysis=dependency_analysis,
            dependency_graph=build_dependency_graph(dependency_analysis, ast_analysis),
            entity_graph=build_entity_graph(ast_analysis),
            architecture_analysis=ArchitectureAnalyzer().analyze(
                ast_analysis,
                dependency_analysis,
            ),
        )

    async def _fetch_source_files(
        self,
        client: httpx.AsyncClient,
        endpoint: str,
        tree_items: list[dict],
    ) -> list[SourceFile]:
        source_files: list[SourceFile] = []
        total_bytes = 0

        for item in tree_items:
            if item.get("type") != "blob":
                continue

            path = item.get("path", "")
            if self._is_excluded_source_path(path):
                continue

            language = self._source_language(path)
            if not language:
                continue

            file_size = item.get("size") or 0
            if file_size > 200_000:
                continue

            if len(source_files) >= MAX_SOURCE_FILES:
                break

            if total_bytes + file_size > MAX_SOURCE_BYTES:
                continue

            file_response = await client.get(
                f"{endpoint}/contents/{quote(path, safe='')}"
            )
            if file_response.status_code == 404:
                continue
            file_response.raise_for_status()

            file_payload = file_response.json()
            if not isinstance(file_payload, dict):
                continue
            if file_payload.get("type") != "file":
                continue

            content = file_payload.get("content", "")
            encoding = file_payload.get("encoding")
            if encoding != "base64":
                continue

            try:
                decoded_content = base64.b64decode(content).decode("utf-8")
            except ValueError:
                decoded_content = base64.b64decode(content).decode("utf-8", errors="replace")

            source_files.append(
                SourceFile(
                    path=path,
                    language=language,
                    content=decoded_content,
                )
            )
            total_bytes += len(decoded_content.encode("utf-8"))

        return source_files

    @staticmethod
    def _source_language(path: str) -> str | None:
        _, extension = os.path.splitext(path)
        return SOURCE_FILE_EXTENSIONS.get(extension.lower())

    @staticmethod
    def _is_excluded_source_path(path: str) -> bool:
        return any(
            directory in EXCLUDED_SOURCE_DIRECTORIES
            for directory in PurePosixPath(path).parts
        )

    @staticmethod
    def _repository_parts(repository_url: str) -> tuple[str, str]:
        parts = urlparse(repository_url).path.strip("/").split("/")
        return parts[0], parts[1]