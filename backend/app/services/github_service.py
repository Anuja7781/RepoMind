from urllib.parse import urlparse

import httpx

from app.schemas import RepositoryAnalysis


class RepositoryNotFoundError(Exception):
    """Raised when GitHub cannot find the requested repository."""


class GitHubAPIError(Exception):
    """Raised when GitHub cannot be reached or returns an unexpected error."""


class GitHubService:
    api_base_url = "https://api.github.com"

    async def analyze_repository(self, repository_url: str) -> RepositoryAnalysis:
        owner, repository = self._repository_parts(repository_url)
        endpoint = f"{self.api_base_url}/repos/{owner}/{repository}"

        try:
            async with httpx.AsyncClient(
                timeout=httpx.Timeout(10.0),
                headers={"Accept": "application/vnd.github+json"},
            ) as client:
                response = await client.get(endpoint)
                if response.status_code == 404:
                    raise RepositoryNotFoundError
                response.raise_for_status()
                repository_data = response.json()

                languages_response = await client.get(f"{endpoint}/languages")
                languages_response.raise_for_status()
                languages = languages_response.json()
        except RepositoryNotFoundError:
            raise
        except (httpx.HTTPError, ValueError) as error:
            raise GitHubAPIError("GitHub API request failed") from error

        return RepositoryAnalysis(
            name=repository_data["name"],
            owner=repository_data["owner"]["login"],
            description=repository_data.get("description"),
            default_branch=repository_data["default_branch"],
            stars=repository_data["stargazers_count"],
            forks=repository_data["forks_count"],
            repository_size=repository_data["size"],
            languages=languages,
        )

    @staticmethod
    def _repository_parts(repository_url: str) -> tuple[str, str]:
        parts = urlparse(repository_url).path.strip("/").split("/")
        return parts[0], parts[1]