from dataclasses import dataclass


@dataclass(frozen=True)
class PitStopEvent:
    driver: str
    lap: int
    from_compound: str | None
    to_compound: str | None
    pit_duration: float | None
