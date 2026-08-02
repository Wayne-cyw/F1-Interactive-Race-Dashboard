from flask import jsonify

from interface_adapters.presenters.track_status_presenter import present_track_status
from use_cases.get_track_status import GetTrackStatusUseCase


class TrackStatusController:
    def __init__(self, use_case: GetTrackStatusUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int):
        events = self._use_case.execute(year, race_round)
        return jsonify(present_track_status(events)), 200
