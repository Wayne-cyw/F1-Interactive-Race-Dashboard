from flask import jsonify

from interface_adapters.presenters.positions_presenter import present_positions
from use_cases.get_race_positions import GetRacePositionsUseCase


class PositionsController:
    def __init__(self, use_case: GetRacePositionsUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int):
        drivers = self._use_case.execute(year, race_round)
        return jsonify(present_positions(drivers)), 200
