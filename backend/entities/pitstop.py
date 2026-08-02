from dataclasses import dataclass


@dataclass(frozen=True)
class PitStopEvent:
    driver: str
    lap: int
    from_compound: str | None
    to_compound: str | None
    pit_duration: float | None
    pit_in_time: float | None = None
    pit_out_time: float | None = None
