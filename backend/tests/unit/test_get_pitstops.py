from entities.pitstop import PitStopEvent
from tests.fakes import FakePitstopRepository
from use_cases.get_pitstops import GetPitstopsUseCase


def test_returns_pitstops_from_repository():
    events = [PitStopEvent(driver="VER", lap=18, from_compound="SOFT", to_compound="HARD", pit_duration=None)]
    use_case = GetPitstopsUseCase(FakePitstopRepository(events=events))
    assert use_case.execute(2026, 1) == events
