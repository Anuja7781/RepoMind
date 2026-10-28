from fastapi.testclient import TestClient

from app import main
from app.schemas import RepositoryAnalysis, SourceFile
from app.services.analysis_transfer_store import AnalysisTransferStore


def example_analysis() -> RepositoryAnalysis:
    return RepositoryAnalysis(
        name="hello-world",
        owner="octocat",
        description="Example repository",
        default_branch="main",
        stars=12,
        forks=3,
        repository_size=64,
        languages={"Python": 100},
        source_files=[
            SourceFile(
                path="src/main.py",
                language="python",
                content="print('hello')\n",
            )
        ],
        source_files_count=1,
    )


def test_temporary_analysis_transfer_returns_existing_analysis():
    client = TestClient(main.create_app())
    analysis = example_analysis().model_dump(mode="json")

    created = client.post("/analysis-results", json={"analysis": analysis})

    assert created.status_code == 201
    result_id = created.json()["result_id"]
    assert len(result_id) == 43
    assert created.json()["expires_in_seconds"] == 600

    retrieved = client.post(
        "/analysis-results/retrieve",
        json={"result_id": result_id},
    )

    assert retrieved.status_code == 200
    assert retrieved.json()["name"] == "hello-world"
    assert retrieved.json()["source_files"][0]["content"] == "print('hello')\n"
    assert client.post(
        "/analysis-results/retrieve",
        json={"result_id": result_id},
    ).status_code == 200


def test_analysis_transfer_retrieval_rejects_unknown_reference():
    client = TestClient(main.create_app())

    response = client.post(
        "/analysis-results/retrieve",
        json={"result_id": "A" * 43},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Analysis result reference is invalid or has expired."


def test_analysis_transfer_expires_and_cleans_up():
    current_time = [100.0]
    store = AnalysisTransferStore(
        ttl_seconds=30,
        clock=lambda: current_time[0],
    )
    client = TestClient(main.create_app(store))

    created = client.post(
        "/analysis-results",
        json={"analysis": example_analysis().model_dump(mode="json")},
    )
    assert created.status_code == 201
    result_id = created.json()["result_id"]

    current_time[0] += 31
    response = client.post(
        "/analysis-results/retrieve",
        json={"result_id": result_id},
    )

    assert response.status_code == 404
