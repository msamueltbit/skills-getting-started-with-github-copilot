from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

import src.app as app_module


@pytest.fixture
def activity_data():
    return {
        "Chess Club": {
            "description": "Play chess",
            "schedule": "Fridays, 3:30 PM",
            "max_participants": 12,
            "participants": ["existing@example.edu", "other@example.edu"],
        },
        "Art Club": {
            "description": "Create art",
            "schedule": "Wednesdays, 3:30 PM",
            "max_participants": 20,
            "participants": [],
        },
    }


@pytest.fixture
def client(monkeypatch, activity_data):
    monkeypatch.setattr(app_module, "activities", deepcopy(activity_data))
    with TestClient(app_module.app) as test_client:
        yield test_client
