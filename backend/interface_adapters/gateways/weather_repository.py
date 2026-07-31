from abc import ABC, abstractmethod

from entities.weather import WeatherData


class WeatherRepository(ABC):
    @abstractmethod
    def get_weather(self, year: int, race_round: int) -> WeatherData:
        ...
