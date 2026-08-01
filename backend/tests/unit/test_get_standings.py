import pytest

from entities.errors import SessionNotFoundError
from entities.session import DriverResult
from tests.fakes import FakeStandingsRepository
from use_cases.get_standings import GetStandingsUseCase


def test_sums_points_across_rounds_and_ranks_descending():
    round_1 = [
        DriverResult(driver="VER", driver_name="Max Verstappen", team="Red Bull Racing", position=1, points=25.0, status="Finished"),
        DriverResult(driver="HAM", driver_name="Lewis Hamilton", team="Mercedes", position=2, points=18.0, status="Finished"),
    ]
    round_2 = [
        DriverResult(driver="HAM", driver_name="Lewis Hamilton", team="Mercedes", position=1, points=25.0, status="Finished"),
        DriverResult(driver="VER", driver_name="Max Verstappen", team="Red Bull Racing", position=2, points=18.0, status="Finished"),
    ]
    repo = FakeStandingsRepository(completed_rounds=[1, 2], results_by_round={1: round_1, 2: round_2})
    result = GetStandingsUseCase(repo).execute(2026)

    assert result.year == 2026
    assert result.last_race == 2
    assert [d.driver for d in result.driver_standings] == ["HAM", "VER"]
    assert result.driver_standings[0].points == 43.0
    assert result.driver_standings[0].position == 1
    assert [t.team for t in result.team_standings] == ["Mercedes", "Red Bull Racing"]
    assert result.team_standings[0].points == 43.0


def test_raises_not_found_when_no_completed_rounds():
    use_case = GetStandingsUseCase(FakeStandingsRepository(completed_rounds=[]))
    with pytest.raises(SessionNotFoundError):
        use_case.execute(2026)
