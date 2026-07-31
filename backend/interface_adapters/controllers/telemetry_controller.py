from flask import jsonify

from interface_adapters.presenters.telemetry_presenter import present_telemetry
from use_cases.get_telemetry import GetTelemetryUseCase


class TelemetryController:
    def __init__(self, use_case: GetTelemetryUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int, session_type: str, driver_code: str):
        data = self._use_case.execute(year, race_round, session_type, driver_code)
        return jsonify(present_telemetry(data)), 200
