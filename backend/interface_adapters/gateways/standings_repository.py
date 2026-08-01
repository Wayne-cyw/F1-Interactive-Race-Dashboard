from abc import ABC, abstractmethod

from entities.session import DriverResult


class StandingsRepository(ABC):
    @abstractmethod
    def get_completed_rounds(self, year: int) -> list[int]:
        ...

    @abstractmethod
    def get_round_results(self, year: int, race_round: int) -> list[DriverResult]:
        ...
