from abc import ABC, abstractmethod

from entities.team import Team


class TeamRepository(ABC):
    @abstractmethod
    def get_teams(self, year: int) -> list[Team]:
        ...
