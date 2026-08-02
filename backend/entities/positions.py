from dataclasses import dataclass


@dataclass(frozen=True)
class PositionPoint:
    t: float
    x: float
    y: float


@dataclass(frozen=True)
class DriverPositions:
    driver: str
    points: list[PositionPoint]
