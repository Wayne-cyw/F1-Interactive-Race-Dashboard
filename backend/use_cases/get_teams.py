from entities.team import Team
from interface_adapters.gateways.team_repository import TeamRepository


class GetTeamsUseCase:
    def __init__(self, repo: TeamRepository):
        self._repo = repo

    def execute(self, year: int) -> list[Team]:
        return self._repo.get_teams(year)
