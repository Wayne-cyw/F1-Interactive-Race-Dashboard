from datetime import datetime

import pytest

from entities.calendar import RaceEvent
from entities.errors import SessionNotFoundError
from entities.pitstop import PitStopEvent
from entities.session import DriverResult, Lap, SessionData, SessionInfo, SessionTypeInfo
from entities.telemetry import TelemetryData, TelemetryPoint
from entities.weather import WeatherData
from frameworks_drivers.web.app import create_app
from tests.fakes import (
    FakeClock,
    FakePitstopRepository,
    FakeSeasonRepository,
    FakeSessionRepository,
    FakeWeatherRepository,
)


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


def test_session_types_route_returns_available_types(client_factory):
    types = [SessionTypeInfo(code="R", name="Race")]
    app = client_factory(session_repo=FakeSessionRepository(session_types=types))
    resp = app.test_client().get("/api/session-types/2026/1")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "success", "sessions": [{"code": "R", "name": "Race"}]}


def test_session_route_returns_laps_and_results(client_factory):
    data = SessionData(
        session_info=SessionInfo(name="Bahrain Grand Prix", country="Bahrain", location="Sakhir", session_type="R"),
        laps=[Lap(driver="VER", lap_number=1, lap_time=91.2, position=1, compound="SOFT", team="Red Bull Racing")],
        results=[DriverResult(driver="VER", driver_name="Max Verstappen", team="Red Bull Racing", position=1, points=25.0, status="Finished")],
        total_laps=57,
    )
    app = client_factory(session_repo=FakeSessionRepository(session_data=data))
    resp = app.test_client().get("/api/session/2026/1/R")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["session"] == {"name": "Bahrain Grand Prix", "country": "Bahrain", "location": "Sakhir", "session_type": "R"}
    assert body["results"][0]["team_color"] == "#3671C6"
    assert body["total_laps"] == 57


def test_weather_route_returns_latest_reading(client_factory):
    weather = WeatherData(air_temp=28.5, track_temp=41.2, humidity=55.0, pressure=1013.0, rainfall=False, wind_speed=2.1, wind_direction=180.0)
    app = client_factory(weather_repo=FakeWeatherRepository(weather=weather))
    resp = app.test_client().get("/api/weather/2026/1")
    assert resp.status_code == 200
    assert resp.get_json()["weather"]["air_temp"] == 28.5


def test_weather_route_returns_404_when_unavailable(client_factory):
    app = client_factory(weather_repo=FakeWeatherRepository(raise_not_found=True))
    resp = app.test_client().get("/api/weather/2026/1")
    assert resp.status_code == 404
    assert resp.get_json() == {"status": "error", "message": "No weather data available"}


def test_telemetry_route_returns_sampled_points(client_factory):
    data = TelemetryData(driver="VER", lap_number=32, lap_time=91.234, points=[TelemetryPoint(distance=0.0, speed=290.5, throttle=100.0, brake=False, gear=7, rpm=11500.0, drs=1)])
    app = client_factory(session_repo=FakeSessionRepository(telemetry=data))
    resp = app.test_client().get("/api/telemetry/2026/1/R/VER")
    assert resp.status_code == 200
    assert resp.get_json()["telemetry"][0]["speed"] == 290.5


def test_telemetry_route_returns_404_when_no_laps(client_factory):
    app = client_factory(session_repo=FakeSessionRepository(telemetry_error=SessionNotFoundError("No laps found for XXX")))
    resp = app.test_client().get("/api/telemetry/2026/1/R/XXX")
    assert resp.status_code == 404
    assert resp.get_json() == {"status": "error", "message": "No laps found for XXX"}


def test_pitstops_route_returns_events(client_factory):
    events = [PitStopEvent(driver="VER", lap=18, from_compound="SOFT", to_compound="HARD", pit_duration=None)]
    app = client_factory(pitstop_repo=FakePitstopRepository(events=events))
    resp = app.test_client().get("/api/pitstops/2026/1")
    assert resp.status_code == 200
    assert resp.get_json()["pit_stops"][0]["to_compound"] == "HARD"
