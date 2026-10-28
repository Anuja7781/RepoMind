import asyncio
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.analysis import router as analysis_router
from app.routers.analysis_transfer import router as analysis_transfer_router
from app.services.analysis_transfer_store import AnalysisTransferStore

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
]
EXTENSION_ID_PATTERN = re.compile(r"^[a-p]{32}$")


def get_cors_origins() -> list[str]:
    origins = list(DEFAULT_CORS_ORIGINS)
    configured_origins = os.getenv("REPOMIND_CORS_ORIGINS", "")

    for configured_origin in configured_origins.split(","):
        origin = configured_origin.strip().rstrip("/")
        if not origin:
            continue

        parsed_origin = urlsplit(origin)
        if (
            parsed_origin.scheme not in {"http", "https", "chrome-extension"}
            or not parsed_origin.netloc
            or parsed_origin.username
            or parsed_origin.password
            or parsed_origin.path
            or parsed_origin.query
            or parsed_origin.fragment
            or "*" in origin
        ):
            raise ValueError(f"Invalid CORS origin in REPOMIND_CORS_ORIGINS: {configured_origin!r}")

        if parsed_origin.scheme == "chrome-extension":
            if not EXTENSION_ID_PATTERN.fullmatch(parsed_origin.netloc):
                raise ValueError("Chrome extension CORS origins must contain an exact 32-character extension ID.")
        elif parsed_origin.scheme == "http" and parsed_origin.hostname not in {
            "localhost",
            "127.0.0.1",
            "::1",
        }:
            raise ValueError("Non-loopback HTTP CORS origins are not allowed; use HTTPS.")

        if origin not in origins:
            origins.append(origin)

    return origins


def create_app(analysis_transfer_store: AnalysisTransferStore | None = None) -> FastAPI:
    transfer_store = analysis_transfer_store or AnalysisTransferStore()

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        async def cleanup_expired_results() -> None:
            while True:
                await asyncio.sleep(60)
                transfer_store.cleanup_expired()

        cleanup_task = asyncio.create_task(cleanup_expired_results())
        try:
            yield
        finally:
            cleanup_task.cancel()
            try:
                await cleanup_task
            except asyncio.CancelledError:
                pass

    application = FastAPI(title="RepoMind AI", lifespan=lifespan)
    application.state.analysis_transfer_store = transfer_store
    application.add_middleware(
        CORSMiddleware,
        allow_origins=get_cors_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type"],
    )
    application.include_router(analysis_router)
    application.include_router(analysis_transfer_router)

    @application.get("/")
    def root():
        return {"message": "RepoMind AI backend is running"}

    return application


app = create_app()