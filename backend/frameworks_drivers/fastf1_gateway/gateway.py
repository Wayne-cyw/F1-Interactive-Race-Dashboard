from functools import lru_cache

import fastf1
import pandas as pd

from entities.calendar import RaceEvent
from entities.session import DriverResult, Lap, SessionData, SessionInfo, SessionTypeInfo
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
    @lru_cache(maxsize=200)
    def _load_session(self, year: int, race_round: int, session_type: str = "R"):
        session = fastf1.get_session(year, race_round, session_type)
        session.load()
        return session

    @staticmethod
    def _driver_result_from_row(row) -> DriverResult:
        return DriverResult(
            driver=row["Abbreviation"] if "Abbreviation" in row.index else None,
            driver_name=row["FullName"] if "FullName" in row.index else None,
            team=row["TeamName"] if "TeamName" in row.index else "Unknown",
            position=int(row["Position"]) if "Position" in row.index and pd.notna(row["Position"]) else None,
            points=float(row["Points"]) if "Points" in row.index and pd.notna(row["Points"]) else 0.0,
            status=row["Status"] if "Status" in row.index else "Unknown",
        )

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

    def get_session_data(self, year: int, race_round: int, session_type: str) -> SessionData:
        session = self._load_session(year, race_round, session_type)
        laps_df = session.laps
        needed_cols = ["Driver", "LapNumber", "LapTime", "Position", "Compound", "Team"]
        available_cols = [c for c in needed_cols if c in laps_df.columns]
        laps_subset = laps_df[available_cols].copy()
        if "LapTime" in laps_subset.columns:
            laps_subset = laps_subset[laps_subset["LapTime"].notna()]

        laps = []
        for _, lap in laps_subset.iterrows():
            laps.append(
                Lap(
                    driver=lap["Driver"] if "Driver" in lap.index else None,
                    lap_number=int(lap["LapNumber"]) if "LapNumber" in lap.index and pd.notna(lap["LapNumber"]) else None,
                    lap_time=lap["LapTime"].total_seconds() if "LapTime" in lap.index and pd.notna(lap["LapTime"]) else None,
                    position=int(lap["Position"]) if "Position" in lap.index and pd.notna(lap["Position"]) else None,
                    compound=(lap["Compound"] if pd.notna(lap["Compound"]) else "UNKNOWN") if "Compound" in lap.index else None,
                    team=lap["Team"] if "Team" in lap.index else None,
                )
            )

        results_df = session.results if hasattr(session, "results") else pd.DataFrame()
        results = [self._driver_result_from_row(r) for _, r in results_df.iterrows()] if not results_df.empty else []

        event = session.event
        session_info = SessionInfo(
            name=event["EventName"], country=event["Country"], location=event["Location"], session_type=session_type,
        )
        total_laps = int(laps_df["LapNumber"].max()) if len(laps_df) > 0 and "LapNumber" in laps_df.columns else 0
        return SessionData(session_info=session_info, laps=laps, results=results, total_laps=total_laps)
