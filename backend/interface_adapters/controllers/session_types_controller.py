from flask import jsonify

from interface_adapters.presenters.session_types_presenter import present_session_types
from use_cases.get_session_types import GetSessionTypesUseCase


class SessionTypesController:
    def __init__(self, use_case: GetSessionTypesUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int):
        types = self._use_case.execute(year, race_round)
        return jsonify(present_session_types(types)), 200
