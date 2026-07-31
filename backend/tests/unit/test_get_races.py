from entities.calendar import RaceEvent
from tests.fakes import FakeSeasonRepository
from use_cases.get_races import GetRacesUseCase


def test_returns_races_from_repository():
    races = [RaceEvent(round=1, name="Bahrain Grand Prix", country="Bahrain", location="Sakhir", date="2026-03-01")]
    use_case = GetRacesUseCase(FakeSeasonRepository(races))
    assert use_case.execute(2026) == races
