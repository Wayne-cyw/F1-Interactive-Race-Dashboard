from dataclasses import dataclass


@dataclass(frozen=True)
class TrackPoint:
    x: float
    y: float


@dataclass(frozen=True)
class TrackLayout:
    name: str
    location: str
    country: str
    coordinates: list[TrackPoint]
