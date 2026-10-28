from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.analysis import router as analysis_router

app = FastAPI(title="RepoMind AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(analysis_router)


@app.get("/")
def root():
    return {
        "message": "RepoMind AI backend is running"
    }