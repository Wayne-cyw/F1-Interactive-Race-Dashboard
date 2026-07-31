from flask import jsonify

from interface_adapters.presenters.races_presenter import present_races
from use_cases.get_races import GetRacesUseCase


class RacesController:
    def __init__(self, use_case: GetRacesUseCase):
        self._use_case = use_case

    def handle(self, year: int):
        races = self._use_case.execute(year)
        return jsonify(present_races(year, races)), 200
