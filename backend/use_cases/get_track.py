from entities.track import TrackLayout
from interface_adapters.gateways.session_repository import SessionRepository


class GetTrackUseCase:
    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int) -> TrackLayout:
        return self._repo.get_track_layout(year, race_round)
