import pytest

from entities.errors import SessionNotFoundError
from entities.track import TrackLayout, TrackPoint
from tests.fakes import FakeSessionRepository
from use_cases.get_track import GetTrackUseCase


def test_returns_track_layout_from_repository():
    layout = TrackLayout(name="Bahrain Grand Prix", location="Sakhir", country="Bahrain", coordinates=[TrackPoint(x=100.0, y=200.0)])
    use_case = GetTrackUseCase(FakeSessionRepository(track_layout=layout))
    assert use_case.execute(2026, 1) == layout


def test_propagates_not_found_error():
    use_case = GetTrackUseCase(FakeSessionRepository(track_error=SessionNotFoundError("No valid lap data available")))
    with pytest.raises(SessionNotFoundError):
        use_case.execute(2026, 1)
