from abc import ABC, abstractmethod

from entities.session import SessionData, SessionTypeInfo


class SessionRepository(ABC):
    @abstractmethod
    def get_available_session_types(self, year: int, race_round: int) -> list[SessionTypeInfo]:
        ...

    @abstractmethod
    def get_session_data(self, year: int, race_round: int, session_type: str) -> SessionData:
        ...
