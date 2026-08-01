from flask import jsonify

from interface_adapters.presenters.track_presenter import present_track
from use_cases.get_track import GetTrackUseCase


class TrackController:
    def __init__(self, use_case: GetTrackUseCase):
        self._use_case = use_case

    def handle(self, year: int, race_round: int):
        layout = self._use_case.execute(year, race_round)
        return jsonify(present_track(layout)), 200
