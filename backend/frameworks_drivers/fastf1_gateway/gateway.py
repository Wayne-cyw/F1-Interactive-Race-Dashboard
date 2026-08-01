from datetime import datetime
from functools import lru_cache

import fastf1
import pandas as pd

from entities.calendar import RaceEvent
from entities.errors import SessionNotFoundError
from entities.pitstop import PitStopEvent
from entities.session import DriverResult, Lap, SessionData, SessionInfo, SessionTypeInfo
from entities.telemetry import TelemetryData, TelemetryPoint
from entities.weather import WeatherData
from interface_adapters.gateways.pitstop_repository import PitstopRepository
from interface_adapters.gateways.season_repository import SeasonRepository
from interface_adapters.gateways.session_repository import SessionRepository
from interface_adapters.gateways.standings_repository import StandingsRepository
from interface_adapters.gateways.weather_repository import WeatherRepository

_SESSION_TYPE_NAMES = {
    "FP1": "Practice 1",
    "FP2": "Practice 2",
    "FP3": "Practice 3",
    "Q": "Qualifying",
    "S": "Sprint",
    "SQ": "Sprint Qualifying",
    "R": "Race",
}


class FastF1Gateway(SeasonRepository, SessionRepository, WeatherRepository, PitstopRepository, StandingsRepository):
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

    def get_telemetry(self, year: int, race_round: int, session_type: str, driver_code: str) -> TelemetryData:
        session = self._load_session(year, race_round, session_type)
        driver_laps = session.laps.pick_driver(driver_code)
        if driver_laps.empty:
            raise SessionNotFoundError(f"No laps found for {driver_code}")
        fastest_lap = driver_laps.pick_fastest()
        if fastest_lap is None or fastest_lap.empty:
            raise SessionNotFoundError("No valid fastest lap")

        telemetry_df = fastest_lap.get_telemetry()
        sampled = telemetry_df.iloc[::10]
        points = [
            TelemetryPoint(
                distance=float(p["Distance"]) if pd.notna(p.get("Distance")) else None,
                speed=float(p["Speed"]) if pd.notna(p.get("Speed")) else None,
                throttle=float(p["Throttle"]) if pd.notna(p.get("Throttle")) else None,
                brake=bool(p["Brake"]) if pd.notna(p.get("Brake")) else False,
                gear=int(p["nGear"]) if pd.notna(p.get("nGear")) else None,
                rpm=float(p["RPM"]) if pd.notna(p.get("RPM")) else None,
                drs=int(p["DRS"]) if pd.notna(p.get("DRS")) else 0,
            )
            for _, p in sampled.iterrows()
        ]
        return TelemetryData(
            driver=driver_code,
            lap_number=int(fastest_lap["LapNumber"]),
            lap_time=fastest_lap["LapTime"].total_seconds(),
            points=points,
        )

    def get_weather(self, year: int, race_round: int) -> WeatherData:
        session = self._load_session(year, race_round, "R")
        weather_df = getattr(session, "weather_data", None)
        if weather_df is None or weather_df.empty:
            raise SessionNotFoundError("No weather data available")
        latest = weather_df.iloc[-1]
        return WeatherData(
            air_temp=float(latest["AirTemp"]) if pd.notna(latest.get("AirTemp")) else None,
            track_temp=float(latest["TrackTemp"]) if pd.notna(latest.get("TrackTemp")) else None,
            humidity=float(latest["Humidity"]) if pd.notna(latest.get("Humidity")) else None,
            pressure=float(latest["Pressure"]) if pd.notna(latest.get("Pressure")) else None,
            rainfall=bool(latest["Rainfall"]) if pd.notna(latest.get("Rainfall")) else False,
            wind_speed=float(latest["WindSpeed"]) if pd.notna(latest.get("WindSpeed")) else None,
            wind_direction=float(latest["WindDirection"]) if pd.notna(latest.get("WindDirection")) else None,
        )

    def get_pitstops(self, year: int, race_round: int) -> list[PitStopEvent]:
        session = self._load_session(year, race_round, "R")
        laps = session.laps
        events = []
        for driver in laps["Driver"].unique():
            driver_laps = laps[laps["Driver"] == driver].sort_values("LapNumber")
            prev_compound = None
            for _, lap in driver_laps.iterrows():
                current_compound = lap.get("Compound")
                if prev_compound is not None and current_compound != prev_compound:
                    events.append(
                        PitStopEvent(
                            driver=driver,
                            lap=int(lap["LapNumber"]),
                            from_compound=prev_compound,
                            to_compound=current_compound,
                            pit_duration=None,
                        )
                    )
                prev_compound = current_compound
        return events

    def get_completed_rounds(self, year: int) -> list[int]:
        schedule = fastf1.get_event_schedule(year)
        completed = schedule[schedule["EventDate"] < datetime.now()]
        return [int(r) for r in completed["RoundNumber"]]

    def get_round_results(self, year: int, race_round: int) -> list[DriverResult]:
        session = self._load_session(year, race_round, "R")
        results_df = session.results
        return [self._driver_result_from_row(r) for _, r in results_df.iterrows()]
