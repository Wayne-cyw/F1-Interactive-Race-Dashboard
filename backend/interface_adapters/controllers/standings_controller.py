from flask import jsonify

from interface_adapters.presenters.standings_presenter import present_standings
from use_cases.get_standings import GetStandingsUseCase


class StandingsController:
    def __init__(self, use_case: GetStandingsUseCase):
        self._use_case = use_case

    def handle(self, year: int):
        data = self._use_case.execute(year)
        return jsonify(present_standings(data)), 200
