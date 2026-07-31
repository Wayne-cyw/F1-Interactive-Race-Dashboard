from dataclasses import dataclass


@dataclass(frozen=True)
class TelemetryPoint:
    distance: float | None
    speed: float | None
    throttle: float | None
    brake: bool
    gear: int | None
    rpm: float | None
    drs: int


@dataclass(frozen=True)
class TelemetryData:
    driver: str
    lap_number: int
    lap_time: float
    points: list[TelemetryPoint]
