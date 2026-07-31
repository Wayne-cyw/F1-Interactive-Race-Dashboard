from abc import ABC, abstractmethod

from entities.session import SessionTypeInfo


class SessionRepository(ABC):
    @abstractmethod
    def get_available_session_types(self, year: int, race_round: int) -> list[SessionTypeInfo]:
        ...
