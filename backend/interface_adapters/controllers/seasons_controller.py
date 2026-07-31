from flask import jsonify

from interface_adapters.presenters.seasons_presenter import present_seasons
from use_cases.get_seasons import GetSeasonsUseCase


class SeasonsController:
    def __init__(self, use_case: GetSeasonsUseCase):
        self._use_case = use_case

    def handle(self):
        seasons = self._use_case.execute()
        return jsonify(present_seasons(seasons)), 200
