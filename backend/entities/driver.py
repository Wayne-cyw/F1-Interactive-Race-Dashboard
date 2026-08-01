from dataclasses import dataclass


@dataclass(frozen=True)
class Driver:
    code: str
    name: str | None
    team: str
