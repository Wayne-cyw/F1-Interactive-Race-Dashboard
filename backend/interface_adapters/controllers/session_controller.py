from flask import jsonify

from interface_adapters.presenters.session_presenter import present_session
from use_cases.get_session import GetSessionUseCase


class SessionController:
    def __init__(self, use_case: GetSessionUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int, session_type: str):
        data = self._use_case.execute(year, race_round, session_type)
        return jsonify(present_session(data)), 200
