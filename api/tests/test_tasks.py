import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal
from models import Task

client = TestClient(app)

# Fresh DB for tests
@pytest.fixture(autouse=True, scope="function")
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_create_task_success():
    payload = {
        "url": "http://example.com",
        "method": "GET",
        "enabled": True,
    }
    resp = client.post("/tasks/", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["url"] == "http://example.com"
    assert data["method"] == "GET"
    assert data["enabled"] is True


def test_create_task_invalid_method():
    payload = {
        "url": "http://example.com",
        "method": "INVALID",
    }
    resp = client.post("/tasks/", json=payload)
    assert resp.status_code == 422  # validation error


def test_list_runs_empty_state():
    # create task
    resp = client.post("/tasks/", json={"url": "http://x.com", "method": "GET"})
    task_id = resp.json()["id"]

    # runs should be empty
    resp = client.get(f"/tasks/{task_id}/runs")
    assert resp.status_code == 200
    assert resp.json() == []
