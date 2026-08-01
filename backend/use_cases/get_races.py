from entities.calendar import RaceEvent
from interface_adapters.gateways.season_repository import SeasonRepository


class GetRacesUseCase:
    def __init__(self, repo: SeasonRepository):
        self._repo = repo

    def execute(self, year: int) -> list[RaceEvent]:
        return self._repo.get_races(year)
