import fastf1
import pandas as pd

from entities.calendar import RaceEvent
from entities.session import SessionTypeInfo
from interface_adapters.gateways.season_repository import SeasonRepository
from interface_adapters.gateways.session_repository import SessionRepository

_SESSION_TYPE_NAMES = {
    "FP1": "Practice 1",
    "FP2": "Practice 2",
    "FP3": "Practice 3",
    "Q": "Qualifying",
    "S": "Sprint",
    "SQ": "Sprint Qualifying",
    "R": "Race",
}


class FastF1Gateway(SeasonRepository, SessionRepository):
    def get_races(self, year: int) -> list[RaceEvent]:
        schedule = fastf1.get_event_schedule(year)
        races = []
        for _, event in schedule.iterrows():
            if event["EventFormat"] == "testing":
                continue
            races.append(
                RaceEvent(
                    round=int(event["RoundNumber"]),
                    name=event["EventName"],
                    country=event["Country"],
                    location=event["Location"],
                    date=event["EventDate"].strftime("%Y-%m-%d")
                    if pd.notna(event["EventDate"])
                    else None,
                )
            )
        return races

    def get_available_session_types(self, year: int, race_round: int) -> list[SessionTypeInfo]:
        # Validates the year/round combination — raises for the app's generic
        # error handler if invalid, matching the original app.py behavior.
        fastf1.get_event(year, race_round)

        available = []
        for code, name in _SESSION_TYPE_NAMES.items():
            try:
                session = fastf1.get_session(year, race_round, code)
                if session is not None:
                    available.append(SessionTypeInfo(code=code, name=name))
            except Exception:
                continue
        return available
