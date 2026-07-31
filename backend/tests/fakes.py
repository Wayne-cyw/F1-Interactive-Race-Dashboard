from datetime import datetime

from entities.calendar import RaceEvent
from entities.session import SessionData, SessionTypeInfo
from interface_adapters.gateways.clock import Clock
from interface_adapters.gateways.season_repository import SeasonRepository
from interface_adapters.gateways.session_repository import SessionRepository


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


class FakeSessionRepository(SessionRepository):
    def __init__(
        self,
        session_types: list[SessionTypeInfo] | None = None,
        session_data: "SessionData | None" = None,
    ):
        self._session_types = session_types or []
        self._session_data = session_data

    def get_available_session_types(self, year: int, race_round: int) -> list[SessionTypeInfo]:
        return self._session_types

    def get_session_data(self, year: int, race_round: int, session_type: str) -> "SessionData":
        return self._session_data
