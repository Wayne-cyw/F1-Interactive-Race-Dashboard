from abc import ABC, abstractmethod

from entities.calendar import RaceEvent


class SeasonRepository(ABC):
    @abstractmethod
    def get_races(self, year: int) -> list[RaceEvent]:
        ...
