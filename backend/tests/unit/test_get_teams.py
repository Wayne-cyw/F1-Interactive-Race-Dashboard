from entities.team import Team, TeamDriver
from tests.fakes import FakeTeamRepository
from use_cases.get_teams import GetTeamsUseCase


def test_returns_teams_from_repository():
    teams = [Team(name="Red Bull Racing", drivers=[TeamDriver(code="VER", name="Max Verstappen")])]
    use_case = GetTeamsUseCase(FakeTeamRepository(teams=teams))
    assert use_case.execute(2026) == teams
