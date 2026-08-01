from dataclasses import dataclass


@dataclass(frozen=True)
class DriverStanding:
    driver: str
    name: str | None
    team: str
    points: float
    position: int


@dataclass(frozen=True)
class ConstructorStanding:
    team: str
    points: float
    position: int


@dataclass(frozen=True)
class StandingsData:
    year: int
    last_race: int
    driver_standings: list[DriverStanding]
    team_standings: list[ConstructorStanding]
