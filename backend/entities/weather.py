from dataclasses import dataclass


@dataclass(frozen=True)
class WeatherData:
    air_temp: float | None
    track_temp: float | None
    humidity: float | None
    pressure: float | None
    rainfall: bool
    wind_speed: float | None
    wind_direction: float | None
