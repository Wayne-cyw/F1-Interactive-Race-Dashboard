from entities.positions import DriverPositions
from interface_adapters.gateways.session_repository import SessionRepository


class GetRacePositionsUseCase:
    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int) -> list[DriverPositions]:
        return self._repo.get_race_positions(year, race_round)
