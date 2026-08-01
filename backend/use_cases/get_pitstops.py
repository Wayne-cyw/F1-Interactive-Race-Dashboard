from entities.pitstop import PitStopEvent
from interface_adapters.gateways.pitstop_repository import PitstopRepository


class GetPitstopsUseCase:
    def __init__(self, repo: PitstopRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int) -> list[PitStopEvent]:
        return self._repo.get_pitstops(year, race_round)
