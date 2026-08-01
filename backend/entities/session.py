from dataclasses import dataclass


@dataclass(frozen=True)
class SessionTypeInfo:
    code: str
    name: str


@dataclass(frozen=True)
class Lap:
    driver: str | None
    lap_number: int | None
    lap_time: float | None = None
    position: int | None = None
    compound: str | None = None
    team: str | None = None


@dataclass(frozen=True)
class DriverResult:
    driver: str | None
    driver_name: str | None
    team: str
    position: int | None
    points: float
    status: str


@dataclass(frozen=True)
class SessionInfo:
    name: str
    country: str
    location: str
    session_type: str


@dataclass(frozen=True)
class SessionData:
    session_info: SessionInfo
    laps: list[Lap]
    results: list[DriverResult]
    total_laps: int
