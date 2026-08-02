import pytest

from entities.errors import SessionNotFoundError
from entities.track_status import TrackStatusEvent
from tests.fakes import FakeSessionRepository
from use_cases.get_track_status import GetTrackStatusUseCase


def test_returns_track_status_from_repository():
    data = [TrackStatusEvent(t=0.0, status="1", message="AllClear")]
    use_case = GetTrackStatusUseCase(FakeSessionRepository(track_status=data))
    assert use_case.execute(2026, 1) == data


def test_propagates_not_found_error():
    use_case = GetTrackStatusUseCase(
        FakeSessionRepository(track_status_error=SessionNotFoundError("No track status data available"))
    )
    with pytest.raises(SessionNotFoundError):
        use_case.execute(2026, 1)
