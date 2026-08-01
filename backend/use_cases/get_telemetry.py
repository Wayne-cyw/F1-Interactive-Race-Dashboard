from entities.telemetry import TelemetryData
from interface_adapters.gateways.session_repository import SessionRepository


class GetTelemetryUseCase:
    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int, session_type: str, driver_code: str) -> TelemetryData:
        return self._repo.get_telemetry(year, race_round, session_type, driver_code)
