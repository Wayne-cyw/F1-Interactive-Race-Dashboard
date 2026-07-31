from dataclasses import dataclass


@dataclass(frozen=True)
class SessionTypeInfo:
    code: str
    name: str
