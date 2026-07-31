from datetime import datetime

from entities.calendar import RaceEvent
from interface_adapters.gateways.clock import Clock
from interface_adapters.gateways.season_repository import SeasonRepository


class FakeClock(Clock):
    def __init__(self, fixed_now: datetime):
        self._fixed_now = fixed_now

    def now(self) -> datetime:
        return self._fixed_now


class FakeSeasonRepository(SeasonRepository):
    def __init__(self, races: list[RaceEvent]):
        self._races = races

    def get_races(self, year: int) -> list[RaceEvent]:
        return self._races
