from entities.session import SessionData
from interface_adapters.gateways.session_repository import SessionRepository


class GetSessionUseCase:
    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int, session_type: str) -> SessionData:
        return self._repo.get_session_data(year, race_round, session_type)
