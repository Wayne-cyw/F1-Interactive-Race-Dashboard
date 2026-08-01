from abc import ABC, abstractmethod

from entities.pitstop import PitStopEvent


class PitstopRepository(ABC):
    @abstractmethod
    def get_pitstops(self, year: int, race_round: int) -> list[PitStopEvent]:
        ...
