from datetime import datetime

import pytest

from entities.calendar import RaceEvent
from frameworks_drivers.web.app import create_app
from tests.fakes import FakeClock, FakeSeasonRepository


@pytest.fixture
def client_factory(tmp_path):
    def _make(**overrides):
        return create_app(clock=FakeClock(datetime(2026, 7, 31)), log_dir=str(tmp_path), **overrides)
    return _make


def test_root_route_returns_status_payload(client_factory):
    resp = client_factory().test_client().get("/")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["status"] == "running"
    assert body["version"] == "3.0"


def test_seasons_route_returns_years_descending(client_factory):
    resp = client_factory().test_client().get("/api/seasons")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body == {
        "status": "success",
        "seasons": [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018],
    }


def test_races_route_returns_races_for_year(client_factory):
    races = [RaceEvent(round=1, name="Bahrain Grand Prix", country="Bahrain", location="Sakhir", date="2026-03-01")]
    app = client_factory(season_repo=FakeSeasonRepository(races))
    resp = app.test_client().get("/api/races/2026")
    assert resp.status_code == 200
    assert resp.get_json() == {
        "status": "success",
        "year": 2026,
        "races": [
            {"round": 1, "name": "Bahrain Grand Prix", "country": "Bahrain", "location": "Sakhir", "date": "2026-03-01"}
        ],
    }
