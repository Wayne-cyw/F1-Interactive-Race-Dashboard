from dataclasses import dataclass


@dataclass(frozen=True)
class TrackStatusEvent:
    t: float
    status: str
    message: str
