from flask import Flask, jsonify
from flask_compress import Compress
from flask_cors import CORS

from entities.errors import DomainError, SessionNotFoundError
from frameworks_drivers import logging_config
from frameworks_drivers.fastf1_gateway.cache import enable_disk_cache
from frameworks_drivers.fastf1_gateway.gateway import FastF1Gateway
from frameworks_drivers.system_clock import SystemClock
from interface_adapters.controllers.races_controller import RacesController
from interface_adapters.controllers.seasons_controller import SeasonsController
from interface_adapters.gateways.clock import Clock
from interface_adapters.gateways.season_repository import SeasonRepository
from use_cases.get_races import GetRacesUseCase
from use_cases.get_seasons import GetSeasonsUseCase


def create_app(
    *,
    clock: Clock | None = None,
    season_repo: SeasonRepository | None = None,
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

    @app.route("/")
    def home():
        return jsonify({
            "message": "F1 Dashboard API Ultimate Edition",
            "status": "running",
            "version": "3.0",
            "features": [
                "Gzip compression",
                "Full season coverage (2018+)",
                "Weather data",
                "Telemetry data",
                "Qualifying & Sprint sessions",
                "Pit stop tracking",
                "Race control messages",
                "Track status",
            ],
        })

    seasons_use_case = GetSeasonsUseCase(clock)
    app.add_url_rule(
        "/api/seasons", view_func=SeasonsController(seasons_use_case).handle
    )

    races_use_case = GetRacesUseCase(season_repo)
    app.add_url_rule(
        "/api/races/<int:year>",
        endpoint="races",
        view_func=RacesController(races_use_case).handle,
    )

    @app.errorhandler(SessionNotFoundError)
    def handle_not_found(e):
        return jsonify({"status": "error", "message": str(e)}), 404

    @app.errorhandler(DomainError)
    @app.errorhandler(Exception)
    def handle_generic_error(e):
        app.logger.error(str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

    return app
