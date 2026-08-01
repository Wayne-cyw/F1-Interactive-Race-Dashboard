from datetime import datetime

import pytest

from entities.calendar import RaceEvent
from entities.driver import Driver
from entities.errors import SessionNotFoundError
from entities.pitstop import PitStopEvent
from entities.positions import DriverPositions, PositionPoint
from entities.session import DriverResult, Lap, SessionData, SessionInfo, SessionTypeInfo
from entities.team import Team, TeamDriver
from entities.telemetry import TelemetryData, TelemetryPoint
from entities.track import TrackLayout, TrackPoint
from entities.weather import WeatherData
from frameworks_drivers.web.app import create_app
from tests.fakes import (
    FakeClock,
    FakePitstopRepository,
    FakeSeasonRepository,
    FakeSessionRepository,
    FakeStandingsRepository,
    FakeTeamRepository,
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
        laps=[Lap(driver="VER", lap_number=1, lap_time=91.2, position=1, compound="SOFT", team="Red Bull Racing", sector_1_time=28.4, sector_2_time=33.1, sector_3_time=29.7, session_time=0.0)],
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
    assert body["laps"][0]["sector_1_time"] == 28.4
    assert body["laps"][0]["sector_2_time"] == 33.1
    assert body["laps"][0]["sector_3_time"] == 29.7
    assert body["laps"][0]["gap_to_leader"] == 0.0
    assert body["laps"][0]["session_time"] == 0.0
    assert body["race_duration_seconds"] == 91.2


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


def test_standings_route_returns_ranked_drivers_and_teams(client_factory):
    round_1 = [DriverResult(driver="VER", driver_name="Max Verstappen", team="Red Bull Racing", position=1, points=25.0, status="Finished")]
    repo = FakeStandingsRepository(completed_rounds=[1], results_by_round={1: round_1})
    app = client_factory(standings_repo=repo)
    resp = app.test_client().get("/api/standings/2026")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["driver_standings"][0]["team_color"] == "#3671C6"
    assert body["last_race"] == 1


def test_standings_route_returns_404_when_no_completed_rounds(client_factory):
    app = client_factory(standings_repo=FakeStandingsRepository(completed_rounds=[]))
    resp = app.test_client().get("/api/standings/2026")
    assert resp.status_code == 404
    assert resp.get_json() == {"status": "error", "message": "No completed races in 2026 yet"}


def test_teams_route_returns_rosters_with_color(client_factory):
    teams = [Team(name="Red Bull Racing", drivers=[TeamDriver(code="VER", name="Max Verstappen")])]
    app = client_factory(team_repo=FakeTeamRepository(teams=teams))
    resp = app.test_client().get("/api/teams/2026")
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["teams"][0] == {
        "name": "Red Bull Racing",
        "color": "#3671C6",
        "drivers": [{"code": "VER", "name": "Max Verstappen"}],
    }


def test_track_route_returns_coordinates(client_factory):
    layout = TrackLayout(name="Bahrain Grand Prix", location="Sakhir", country="Bahrain", coordinates=[TrackPoint(x=100.0, y=200.0)])
    app = client_factory(session_repo=FakeSessionRepository(track_layout=layout))
    resp = app.test_client().get("/api/track/2026/1")
    assert resp.status_code == 200
    assert resp.get_json()["track"]["coordinates"] == [{"x": 100.0, "y": 200.0}]


def test_track_route_returns_404_when_no_lap_data(client_factory):
    app = client_factory(session_repo=FakeSessionRepository(track_error=SessionNotFoundError("No valid lap data available")))
    resp = app.test_client().get("/api/track/2026/1")
    assert resp.status_code == 404
    assert resp.get_json() == {"status": "error", "message": "No valid lap data available"}


def test_positions_route_returns_driver_points(client_factory):
    data = [DriverPositions(driver="VER", points=[PositionPoint(t=0.0, x=100.0, y=200.0)])]
    app = client_factory(session_repo=FakeSessionRepository(positions=data))
    resp = app.test_client().get("/api/positions/2026/1")
    assert resp.status_code == 200
    assert resp.get_json()["drivers"][0] == {"driver": "VER", "points": [{"t": 0.0, "x": 100.0, "y": 200.0}]}


def test_positions_route_returns_404_when_unavailable(client_factory):
    app = client_factory(session_repo=FakeSessionRepository(positions_error=SessionNotFoundError("No position data available")))
    resp = app.test_client().get("/api/positions/2026/1")
    assert resp.status_code == 404
    assert resp.get_json() == {"status": "error", "message": "No position data available"}


def test_drivers_route_returns_roster_with_color(client_factory):
    drivers = [Driver(code="VER", name="Max Verstappen", team="Red Bull Racing")]
    app = client_factory(session_repo=FakeSessionRepository(driver_roster=drivers))
    resp = app.test_client().get("/api/drivers/2026/1")
    assert resp.status_code == 200
    assert resp.get_json()["drivers"][0] == {
        "code": "VER", "name": "Max Verstappen", "team": "Red Bull Racing", "team_color": "#3671C6",
    }


def test_undefined_route_returns_404(client_factory):
    resp = client_factory().test_client().get("/api/does-not-exist")
    assert resp.status_code == 404


def test_wrong_http_method_returns_405(client_factory):
    resp = client_factory().test_client().post("/api/seasons")
    assert resp.status_code == 405
