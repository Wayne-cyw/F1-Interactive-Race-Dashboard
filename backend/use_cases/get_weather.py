from entities.weather import WeatherData
from interface_adapters.gateways.weather_repository import WeatherRepository


class GetWeatherUseCase:
    def __init__(self, repo: WeatherRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int) -> WeatherData:
        return self._repo.get_weather(year, race_round)
