from fastapi import FastAPI

from app.routers.analysis import router as analysis_router

app = FastAPI(title="RepoMind AI")
app.include_router(analysis_router)


@app.get("/")
def root():
    return {
        "message": "RepoMind AI backend is running"
    }