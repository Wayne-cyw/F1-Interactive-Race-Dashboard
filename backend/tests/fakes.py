from datetime import datetime

from entities.calendar import RaceEvent
from entities.errors import SessionNotFoundError
from entities.pitstop import PitStopEvent
from entities.session import SessionData, SessionTypeInfo
from entities.telemetry import TelemetryData
from entities.weather import WeatherData
from interface_adapters.gateways.clock import Clock
from interface_adapters.gateways.pitstop_repository import PitstopRepository
from interface_adapters.gateways.season_repository import SeasonRepository
from interface_adapters.gateways.session_repository import SessionRepository
from interface_adapters.gateways.weather_repository import WeatherRepository


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
        telemetry: "TelemetryData | None" = None,
        telemetry_error: Exception | None = None,
    ):
        self._session_types = session_types or []
        self._session_data = session_data
        self._telemetry = telemetry
        self._telemetry_error = telemetry_error

    def get_available_session_types(self, year: int, race_round: int) -> list[SessionTypeInfo]:
        return self._session_types

    def get_session_data(self, year: int, race_round: int, session_type: str) -> "SessionData":
        return self._session_data

    def get_telemetry(self, year: int, race_round: int, session_type: str, driver_code: str) -> "TelemetryData":
        if self._telemetry_error:
            raise self._telemetry_error
        return self._telemetry


class FakeWeatherRepository(WeatherRepository):
    def __init__(self, weather: WeatherData | None = None, raise_not_found: bool = False):
        self._weather = weather
        self._raise_not_found = raise_not_found

    def get_weather(self, year: int, race_round: int) -> WeatherData:
        if self._raise_not_found:
            raise SessionNotFoundError("No weather data available")
        return self._weather


class FakePitstopRepository(PitstopRepository):
    def __init__(self, events: list[PitStopEvent] | None = None):
        self._events = events or []

    def get_pitstops(self, year: int, race_round: int) -> list[PitStopEvent]:
        return self._events
