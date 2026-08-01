from abc import ABC, abstractmethod

from entities.session import SessionData, SessionTypeInfo
from entities.telemetry import TelemetryData
from entities.track import TrackLayout


class SessionRepository(ABC):
    @abstractmethod
    def get_available_session_types(self, year: int, race_round: int) -> list[SessionTypeInfo]:
        ...

    @abstractmethod
    def get_session_data(self, year: int, race_round: int, session_type: str) -> SessionData:
        ...

    @abstractmethod
    def get_telemetry(self, year: int, race_round: int, session_type: str, driver_code: str) -> TelemetryData:
        ...

    @abstractmethod
    def get_track_layout(self, year: int, race_round: int) -> TrackLayout:
        ...
