from datetime import datetime

import pytest

from frameworks_drivers.web.app import create_app
from tests.fakes import FakeClock


@pytest.fixture
def client(tmp_path):
    app = create_app(clock=FakeClock(datetime(2026, 7, 31)), log_dir=str(tmp_path))
    app.testing = True
    return app.test_client()


def test_root_route_returns_status_payload(client):
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "running"
    assert body["version"] == "3.0"


def test_seasons_route_returns_years_descending(client):
    resp = client.get("/api/seasons")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body == {
        "status": "success",
        "seasons": [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018],
    }
