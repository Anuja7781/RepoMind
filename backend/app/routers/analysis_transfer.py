from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel

from app.schemas import RepositoryAnalysis
from app.services.analysis_transfer_store import (
    AnalysisTransferStore,
    AnalysisTransferStoreFullError,
)


router = APIRouter()


class AnalysisTransferRequest(BaseModel):
    analysis: RepositoryAnalysis


class AnalysisTransferResponse(BaseModel):
    result_id: str
    expires_in_seconds: int


class AnalysisTransferLookupRequest(BaseModel):
    result_id: str


def _store_from_request(request: Request) -> AnalysisTransferStore:
    return request.app.state.analysis_transfer_store


@router.post(
    "/analysis-results",
    response_model=AnalysisTransferResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_analysis_transfer(
    transfer: AnalysisTransferRequest,
    request: Request,
    response: Response,
) -> AnalysisTransferResponse:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    try:
        result_id, expires_in_seconds = _store_from_request(request).store(transfer.analysis)
    except AnalysisTransferStoreFullError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Temporary analysis transfer storage is full. Try again shortly.",
        ) from error

    return AnalysisTransferResponse(
        result_id=result_id,
        expires_in_seconds=expires_in_seconds,
    )


@router.post("/analysis-results/retrieve", response_model=RepositoryAnalysis)
async def retrieve_analysis_transfer(
    lookup: AnalysisTransferLookupRequest,
    request: Request,
    response: Response,
) -> RepositoryAnalysis:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"
    analysis = _store_from_request(request).retrieve(lookup.result_id)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis result reference is invalid or has expired.",
        )
    return analysis
