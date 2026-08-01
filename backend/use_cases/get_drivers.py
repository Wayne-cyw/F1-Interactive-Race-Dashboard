from entities.driver import Driver
from interface_adapters.gateways.session_repository import SessionRepository


class GetDriversUseCase:
    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int) -> list[Driver]:
        return self._repo.get_driver_roster(year, race_round)
