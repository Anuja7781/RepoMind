from fastapi import APIRouter, HTTPException, status

from app.schemas import AnalyzeRequest, RepositoryAnalysis
from app.services.config import ConfigurationError
from app.services.github_service import GitHubAPIError, GitHubService, RepositoryNotFoundError


router = APIRouter()


@router.post("/analyze", response_model=RepositoryAnalysis)
async def analyze_repository(request: AnalyzeRequest) -> RepositoryAnalysis:
    try:
        return await GitHubService().analyze_repository(request.repository_url)
    except RepositoryNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub repository not found",
        ) from error
    except GitHubAPIError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to retrieve repository information from GitHub",
        ) from error
    except ConfigurationError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub token is not configured",
        ) from error