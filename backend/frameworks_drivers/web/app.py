from flask import Flask, jsonify
from flask_compress import Compress
from flask_cors import CORS

from entities.errors import DomainError, SessionNotFoundError
from frameworks_drivers import logging_config
from frameworks_drivers.system_clock import SystemClock
from interface_adapters.controllers.seasons_controller import SeasonsController
from interface_adapters.gateways.clock import Clock
from use_cases.get_seasons import GetSeasonsUseCase


def create_app(*, clock: Clock | None = None, log_dir: str | None = None) -> Flask:
    app = Flask(__name__)
    CORS(app)
    Compress(app)

    logging_config.configure(app, log_dir=log_dir)

    clock = clock or SystemClock()

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

    @app.errorhandler(SessionNotFoundError)
    def handle_not_found(e):
        return jsonify({"status": "error", "message": str(e)}), 404

    @app.errorhandler(DomainError)
    @app.errorhandler(Exception)
    def handle_generic_error(e):
        app.logger.error(str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

    return app
