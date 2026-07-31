from flask import jsonify

from interface_adapters.presenters.weather_presenter import present_weather
from use_cases.get_weather import GetWeatherUseCase


class WeatherController:
    def __init__(self, use_case: GetWeatherUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int):
        weather = self._use_case.execute(year, race_round)
        return jsonify(present_weather(weather)), 200
