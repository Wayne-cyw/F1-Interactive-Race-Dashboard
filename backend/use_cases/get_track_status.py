from entities.track_status import TrackStatusEvent
from interface_adapters.gateways.session_repository import SessionRepository


class GetTrackStatusUseCase:
    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int) -> list[TrackStatusEvent]:
        return self._repo.get_track_status(year, race_round)
