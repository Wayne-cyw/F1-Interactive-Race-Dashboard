import pytest

from entities.errors import SessionNotFoundError
from entities.positions import DriverPositions, PositionPoint
from tests.fakes import FakeSessionRepository
from use_cases.get_race_positions import GetRacePositionsUseCase


def test_returns_positions_from_repository():
    data = [DriverPositions(driver="VER", points=[PositionPoint(t=0.0, x=100.0, y=200.0)])]
    use_case = GetRacePositionsUseCase(FakeSessionRepository(positions=data))
    assert use_case.execute(2026, 1) == data


def test_propagates_not_found_error():
    use_case = GetRacePositionsUseCase(FakeSessionRepository(positions_error=SessionNotFoundError("No position data available")))
    with pytest.raises(SessionNotFoundError):
        use_case.execute(2026, 1)
