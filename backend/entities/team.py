from dataclasses import dataclass, field


@dataclass(frozen=True)
class TeamDriver:
    code: str
    name: str | None


@dataclass(frozen=True)
class Team:
    name: str
    drivers: list[TeamDriver] = field(default_factory=list)
