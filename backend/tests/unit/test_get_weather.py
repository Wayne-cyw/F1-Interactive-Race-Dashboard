import pytest

from entities.errors import SessionNotFoundError
from entities.weather import WeatherData
from tests.fakes import FakeWeatherRepository
from use_cases.get_weather import GetWeatherUseCase


def test_returns_weather_from_repository():
    weather = WeatherData(air_temp=28.5, track_temp=41.2, humidity=55.0, pressure=1013.0, rainfall=False, wind_speed=2.1, wind_direction=180.0)
    use_case = GetWeatherUseCase(FakeWeatherRepository(weather=weather))
    assert use_case.execute(2026, 1) == weather


def test_propagates_not_found_error():
    use_case = GetWeatherUseCase(FakeWeatherRepository(raise_not_found=True))
    with pytest.raises(SessionNotFoundError):
        use_case.execute(2026, 1)
