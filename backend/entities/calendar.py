from dataclasses import dataclass


@dataclass(frozen=True)
class RaceEvent:
    round: int
    name: str
    country: str
    location: str
    date: str | None
