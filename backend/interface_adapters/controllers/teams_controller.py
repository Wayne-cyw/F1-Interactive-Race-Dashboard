from flask import jsonify

from interface_adapters.presenters.teams_presenter import present_teams
from use_cases.get_teams import GetTeamsUseCase


class TeamsController:
    def __init__(self, use_case: GetTeamsUseCase):
        self._use_case = use_case

    def handle(self, year: int):
        teams = self._use_case.execute(year)
        return jsonify(present_teams(year, teams)), 200
