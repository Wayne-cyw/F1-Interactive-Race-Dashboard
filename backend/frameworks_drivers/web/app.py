from flask import Flask, jsonify, request
from flask_compress import Compress
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from entities.errors import DomainError, SessionNotFoundError
from frameworks_drivers import logging_config
from frameworks_drivers.fastf1_gateway.cache import enable_disk_cache
from frameworks_drivers.fastf1_gateway.gateway import FastF1Gateway
from frameworks_drivers.system_clock import SystemClock
from interface_adapters.controllers.drivers_controller import DriversController
from interface_adapters.controllers.pitstops_controller import PitstopsController
from interface_adapters.controllers.positions_controller import PositionsController
from interface_adapters.controllers.races_controller import RacesController
from interface_adapters.controllers.seasons_controller import SeasonsController
from interface_adapters.controllers.session_controller import SessionController
from interface_adapters.controllers.session_types_controller import SessionTypesController
from interface_adapters.controllers.standings_controller import StandingsController
from interface_adapters.controllers.teams_controller import TeamsController
from interface_adapters.controllers.telemetry_controller import TelemetryController
from interface_adapters.controllers.track_controller import TrackController
from interface_adapters.controllers.track_status_controller import TrackStatusController
from interface_adapters.controllers.weather_controller import WeatherController
from interface_adapters.gateways.clock import Clock
from interface_adapters.gateways.pitstop_repository import PitstopRepository
from interface_adapters.gateways.season_repository import SeasonRepository
from interface_adapters.gateways.session_repository import SessionRepository
from interface_adapters.gateways.standings_repository import StandingsRepository
from interface_adapters.gateways.team_repository import TeamRepository
from interface_adapters.gateways.weather_repository import WeatherRepository
from use_cases.get_drivers import GetDriversUseCase
from use_cases.get_pitstops import GetPitstopsUseCase
from use_cases.get_races import GetRacesUseCase
from use_cases.get_race_positions import GetRacePositionsUseCase
from use_cases.get_seasons import GetSeasonsUseCase
from use_cases.get_session import GetSessionUseCase
from use_cases.get_session_types import GetSessionTypesUseCase
from use_cases.get_standings import GetStandingsUseCase
from use_cases.get_teams import GetTeamsUseCase
from use_cases.get_telemetry import GetTelemetryUseCase
from use_cases.get_track import GetTrackUseCase
from use_cases.get_track_status import GetTrackStatusUseCase
from use_cases.get_weather import GetWeatherUseCase


def create_app(
    *,
    clock: Clock | None = None,
    season_repo: SeasonRepository | None = None,
    session_repo: SessionRepository | None = None,
    weather_repo: WeatherRepository | None = None,
    pitstop_repo: PitstopRepository | None = None,
    standings_repo: StandingsRepository | None = None,
    team_repo: TeamRepository | None = None,
    log_dir: str | None = None,
) -> Flask:
    app = Flask(__name__)
    CORS(app)
    Compress(app)

    logging_config.configure(app, log_dir=log_dir)

    clock = clock or SystemClock()
    enable_disk_cache()
    gateway = FastF1Gateway()
    season_repo = season_repo or gateway
    session_repo = session_repo or gateway
    weather_repo = weather_repo or gateway
    pitstop_repo = pitstop_repo or gateway
    standings_repo = standings_repo or gateway
    team_repo = team_repo or gateway

    @app.route("/")
    def home():
        return jsonify({"message": "F1 Dashboard API", "status": "running"})

    routes = [
        ("/api/seasons", "seasons_route", SeasonsController(GetSeasonsUseCase(clock))),
        ("/api/races/<int:year>", "races_route", RacesController(GetRacesUseCase(season_repo))),
        (
            "/api/session-types/<int:year>/<int:race_round>",
            "session_types_route",
            SessionTypesController(GetSessionTypesUseCase(session_repo)),
        ),
        (
            "/api/session/<int:year>/<int:race_round>/<session_type>",
            "session_route",
            SessionController(GetSessionUseCase(session_repo)),
        ),
        (
            "/api/weather/<int:year>/<int:race_round>",
            "weather_route",
            WeatherController(GetWeatherUseCase(weather_repo)),
        ),
        (
            "/api/telemetry/<int:year>/<int:race_round>/<session_type>/<driver_code>",
            "telemetry_route",
            TelemetryController(GetTelemetryUseCase(session_repo)),
        ),
        (
            "/api/pitstops/<int:year>/<int:race_round>",
            "pitstops_route",
            PitstopsController(GetPitstopsUseCase(pitstop_repo)),
        ),
        ("/api/standings/<int:year>", "standings_route", StandingsController(GetStandingsUseCase(standings_repo))),
        ("/api/teams/<int:year>", "teams_route", TeamsController(GetTeamsUseCase(team_repo))),
        (
            "/api/track/<int:year>/<int:race_round>",
            "track_route",
            TrackController(GetTrackUseCase(session_repo)),
        ),
        (
            "/api/positions/<int:year>/<int:race_round>",
            "positions_route",
            PositionsController(GetRacePositionsUseCase(session_repo)),
        ),
        (
            "/api/track-status/<int:year>/<int:race_round>",
            "track_status_route",
            TrackStatusController(GetTrackStatusUseCase(session_repo)),
        ),
        (
            "/api/drivers/<int:year>/<int:race_round>",
            "drivers_route",
            DriversController(GetDriversUseCase(session_repo)),
        ),
    ]
    for rule, endpoint, controller in routes:
        app.add_url_rule(rule, endpoint=endpoint, view_func=controller.handle)

    @app.errorhandler(SessionNotFoundError)
    def handle_not_found(e):
        return jsonify({"status": "error", "message": str(e)}), 404

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return e

    @app.errorhandler(DomainError)
    @app.errorhandler(Exception)
    def handle_generic_error(e):
        app.logger.exception("Unhandled error on %s %s", request.method, request.path)
        return jsonify({"status": "error", "message": str(e)}), 500

    return app
