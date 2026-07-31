from datetime import datetime

from tests.fakes import FakeClock
from use_cases.get_seasons import GetSeasonsUseCase


def test_returns_years_2018_through_current_year_descending():
    use_case = GetSeasonsUseCase(FakeClock(datetime(2026, 7, 31)))
    assert use_case.execute() == [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018]
