from dataclasses import dataclass


@dataclass(frozen=True)
class PositionPoint:
    t: float
    x: float
    y: float
    z: float = 0.0


@dataclass(frozen=True)
class DriverPositions:
    driver: str
    points: list[PositionPoint]
