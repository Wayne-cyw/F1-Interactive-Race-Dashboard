from dataclasses import dataclass


@dataclass(frozen=True)
class TelemetryPoint:
    t: float
    speed: float | None
    throttle: float | None
    brake: bool
    gear: int | None
    rpm: float | None
    drs: int


@dataclass(frozen=True)
class TelemetryData:
    driver: str
    points: list[TelemetryPoint]
