from entities.session import SessionTypeInfo
from interface_adapters.gateways.session_repository import SessionRepository


class GetSessionTypesUseCase:
    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int) -> list[SessionTypeInfo]:
        return self._repo.get_available_session_types(year, race_round)
