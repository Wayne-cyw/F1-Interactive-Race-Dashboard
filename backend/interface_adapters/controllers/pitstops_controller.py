from flask import jsonify

from interface_adapters.presenters.pitstops_presenter import present_pitstops
from use_cases.get_pitstops import GetPitstopsUseCase


class PitstopsController:
    def __init__(self, use_case: GetPitstopsUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int):
        events = self._use_case.execute(year, race_round)
        return jsonify(present_pitstops(events)), 200
