import logging
from datetime import datetime
from functools import lru_cache

import fastf1
import pandas as pd

from entities.calendar import RaceEvent
from entities.driver import Driver
from entities.errors import SessionNotFoundError
from entities.pitstop import PitStopEvent
from entities.positions import DriverPositions, PositionPoint
from entities.session import DriverResult, Lap, SessionData, SessionInfo, SessionTypeInfo
from entities.team import Team, TeamDriver
from entities.telemetry import TelemetryData, TelemetryPoint
from entities.track import TrackLayout, TrackPoint
from entities.track_status import TrackStatusEvent
from entities.weather import WeatherData
from interface_adapters.gateways.pitstop_repository import PitstopRepository
from interface_adapters.gateways.season_repository import SeasonRepository
from interface_adapters.gateways.session_repository import SessionRepository
from interface_adapters.gateways.standings_repository import StandingsRepository
from interface_adapters.gateways.team_repository import TeamRepository
from interface_adapters.gateways.weather_repository import WeatherRepository

logger = logging.getLogger(__name__)

_SESSION_TYPE_NAMES = {
    "FP1": "Practice 1",
    "FP2": "Practice 2",
    "FP3": "Practice 3",
    "Q": "Qualifying",
    "S": "Sprint",
    "SQ": "Sprint Qualifying",
    "R": "Race",
}

# Derived per-race payloads (positions, track, status) are much smaller than a session.
_DERIVED_CACHE_SIZE = 50


def _clean(value, cast=None, default=None):
    """`value` passed through `cast`, or `default` when it is missing/NaN/NaT."""
    if value is None or pd.isna(value):
        return default
    return cast(value) if cast else value


def _field(row, column, cast=None, default=None):
    """`_clean` applied to `row[column]`; `default` also covers an absent column."""
    return _clean(row[column], cast, default) if column in row.index else default


def _seconds(timedelta):
    return timedelta.total_seconds()


class FastF1Gateway(
    SeasonRepository,
    SessionRepository,
    WeatherRepository,
    PitstopRepository,
    StandingsRepository,
    TeamRepository,
):
    @lru_cache(maxsize=200)
    def _load_session(self, year: int, race_round: int, session_type: str = "R"):
        logger.info(f"Loading session: {year} Round {race_round} ({session_type})")
        session = fastf1.get_session(year, race_round, session_type)
        session.load()
        logger.info(f"Session loaded: {year} Round {race_round}")
        return session

    @staticmethod
    def _green_flag_t0(session):
        laps = session.laps
        if "LapStartTime" not in laps.columns:
            return pd.Timedelta(0)
        lap_one = laps[(laps["LapNumber"] == 1) & laps["LapStartTime"].notna()]
        if lap_one.empty:
            return pd.Timedelta(0)
        return lap_one["LapStartTime"].min()

    @staticmethod
    def _resample_half_second(df, time_col):
        df = df[df[time_col].notna()]
        bucket = (df[time_col].dt.total_seconds() // 0.5).astype(int)
        return df.groupby(bucket).first()

    @staticmethod
    def _safe_z(value) -> float:
        return _clean(value, float, default=0.0)

    @staticmethod
    def _driver_result_from_row(row) -> DriverResult:
        return DriverResult(
            driver=_field(row, "Abbreviation"),
            driver_name=_field(row, "FullName"),
            team=_field(row, "TeamName", default="Unknown"),
            position=_field(row, "Position", int),
            points=_field(row, "Points", float, default=0.0),
            status=_field(row, "Status", default="Unknown"),
            grid_position=_field(row, "GridPosition", int),
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
        t0 = self._green_flag_t0(session)
        needed_cols = [
            "Driver", "LapNumber", "LapTime", "Position", "Compound", "Team",
            "Sector1Time", "Sector2Time", "Sector3Time", "LapStartTime",
        ]
        available_cols = [c for c in needed_cols if c in laps_df.columns]
        laps_subset = laps_df[available_cols].copy()
        if "LapTime" in laps_subset.columns:
            laps_subset = laps_subset[laps_subset["LapTime"].notna()]

        laps = []
        for _, lap in laps_subset.iterrows():
            laps.append(
                Lap(
                    driver=_field(lap, "Driver"),
                    lap_number=_field(lap, "LapNumber", int),
                    lap_time=_field(lap, "LapTime", _seconds),
                    position=_field(lap, "Position", int),
                    compound=_field(lap, "Compound", default="UNKNOWN"),
                    team=_field(lap, "Team"),
                    sector_1_time=_field(lap, "Sector1Time", _seconds),
                    sector_2_time=_field(lap, "Sector2Time", _seconds),
                    sector_3_time=_field(lap, "Sector3Time", _seconds),
                    session_time=_field(lap, "LapStartTime", lambda start: _seconds(start - t0)),
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

        driver_number = driver_laps["DriverNumber"].iloc[0]
        car = session.car_data.get(driver_number)
        if car is None or car.empty:
            raise SessionNotFoundError(f"No telemetry found for {driver_code}")

        t0 = self._green_flag_t0(session)
        resampled = self._resample_half_second(car, "SessionTime")
        points = []
        for row in resampled.itertuples():
            t = _seconds(row.SessionTime - t0)
            if t < 0:
                continue
            points.append(
                TelemetryPoint(
                    t=t,
                    speed=_clean(getattr(row, "Speed", None), float),
                    throttle=_clean(getattr(row, "Throttle", None), float),
                    brake=_clean(getattr(row, "Brake", None), bool, default=False),
                    gear=_clean(getattr(row, "nGear", None), int),
                    rpm=_clean(getattr(row, "RPM", None), float),
                    drs=_clean(getattr(row, "DRS", None), int, default=0),
                )
            )
        return TelemetryData(driver=driver_code, points=points)

    @lru_cache(maxsize=_DERIVED_CACHE_SIZE)
    def get_track_layout(self, year: int, race_round: int) -> TrackLayout:
        session = self._load_session(year, race_round, "R")
        fastest_lap = session.laps.pick_fastest()
        if fastest_lap is None or fastest_lap.empty:
            raise SessionNotFoundError("No valid lap data available")

        telemetry = fastest_lap.get_telemetry()
        coordinates = [
            TrackPoint(
                x=float(p["X"]),
                y=float(p["Y"]),
                z=self._safe_z(p.get("Z")),
            )
            for _, p in telemetry.iterrows()
            if pd.notna(p.get("X")) and pd.notna(p.get("Y"))
        ]
        event = session.event
        return TrackLayout(name=event["EventName"], location=event["Location"], country=event["Country"], coordinates=coordinates)

    def get_weather(self, year: int, race_round: int) -> WeatherData:
        session = self._load_session(year, race_round, "R")
        weather_df = getattr(session, "weather_data", None)
        if weather_df is None or weather_df.empty:
            raise SessionNotFoundError("No weather data available")
        latest = weather_df.iloc[-1]
        return WeatherData(
            air_temp=_field(latest, "AirTemp", float),
            track_temp=_field(latest, "TrackTemp", float),
            humidity=_field(latest, "Humidity", float),
            pressure=_field(latest, "Pressure", float),
            rainfall=_field(latest, "Rainfall", bool, default=False),
            wind_speed=_field(latest, "WindSpeed", float),
            wind_direction=_field(latest, "WindDirection", float),
        )

    def get_pitstops(self, year: int, race_round: int) -> list[PitStopEvent]:
        session = self._load_session(year, race_round, "R")
        laps = session.laps
        t0 = self._green_flag_t0(session)
        events = []
        for driver in laps["Driver"].unique():
            driver_laps = laps[laps["Driver"] == driver].sort_values("LapNumber")
            prev_compound = None
            prev_lap = None
            for _, lap in driver_laps.iterrows():
                current_compound = lap.get("Compound")
                if prev_compound is not None and current_compound != prev_compound:
                    pit_in_time = prev_lap.get("PitInTime") if prev_lap is not None else None
                    pit_out_time = lap.get("PitOutTime")
                    events.append(
                        PitStopEvent(
                            driver=driver,
                            lap=int(lap["LapNumber"]),
                            from_compound=prev_compound,
                            to_compound=current_compound,
                            pit_duration=None,
                            pit_in_time=_clean(pit_in_time, lambda time: _seconds(time - t0)),
                            pit_out_time=_clean(pit_out_time, lambda time: _seconds(time - t0)),
                        )
                    )
                prev_compound = current_compound
                prev_lap = lap
        return events

    def get_completed_rounds(self, year: int) -> list[int]:
        schedule = fastf1.get_event_schedule(year)
        completed = schedule[schedule["EventDate"] < datetime.now()]
        return [int(r) for r in completed["RoundNumber"]]

    def get_round_results(self, year: int, race_round: int) -> list[DriverResult]:
        session = self._load_session(year, race_round, "R")
        results_df = session.results
        return [self._driver_result_from_row(r) for _, r in results_df.iterrows()]

    def get_teams(self, year: int) -> list[Team]:
        session = self._load_session(year, 1, "R")
        results = session.results
        teams: dict[str, Team] = {}
        order: list[str] = []
        for _, r in results.iterrows():
            team_name = r["TeamName"]
            if team_name not in teams:
                teams[team_name] = Team(name=team_name, drivers=[])
                order.append(team_name)
            teams[team_name].drivers.append(TeamDriver(code=r["Abbreviation"], name=r["FullName"]))
        return [teams[name] for name in order]

    def get_driver_roster(self, year: int, race_round: int) -> list[Driver]:
        session = self._load_session(year, race_round, "R")
        results = session.results
        return [
            Driver(code=r["Abbreviation"], name=r["FullName"], team=r["TeamName"])
            for _, r in results.iterrows()
        ]

    @lru_cache(maxsize=_DERIVED_CACHE_SIZE)
    def get_race_positions(self, year: int, race_round: int) -> list[DriverPositions]:
        session = self._load_session(year, race_round, "R")
        if session.pos_data is None or len(session.pos_data) == 0:
            raise SessionNotFoundError("No position data available")

        t0 = self._green_flag_t0(session)
        result = []
        for drv in session.drivers:
            pos = session.pos_data.get(drv)
            if pos is None or pos.empty:
                continue
            driver_rows = session.laps[session.laps["DriverNumber"] == drv]
            if driver_rows.empty:
                continue
            driver_code = driver_rows["Driver"].iloc[0]

            resampled = self._resample_half_second(pos, "SessionTime")
            points = []
            for row in resampled.itertuples():
                x = getattr(row, "X", None)
                y = getattr(row, "Y", None)
                z = getattr(row, "Z", None)
                if pd.isna(x) or pd.isna(y):
                    continue
                t = _seconds(row.SessionTime - t0)
                if t < 0:
                    continue
                points.append(PositionPoint(t=t, x=float(x), y=float(y), z=self._safe_z(z)))
            result.append(DriverPositions(driver=driver_code, points=points))
        return result

    @lru_cache(maxsize=_DERIVED_CACHE_SIZE)
    def get_track_status(self, year: int, race_round: int) -> list[TrackStatusEvent]:
        session = self._load_session(year, race_round, "R")
        status_df = getattr(session, "track_status", None)
        if status_df is None or status_df.empty:
            raise SessionNotFoundError("No track status data available")

        t0 = self._green_flag_t0(session)
        events = []
        for row in status_df.sort_values("Time").itertuples():
            events.append(
                TrackStatusEvent(
                    t=_seconds(row.Time - t0),
                    status=str(row.Status),
                    message=str(row.Message) if pd.notna(row.Message) else "",
                )
            )
        return events
