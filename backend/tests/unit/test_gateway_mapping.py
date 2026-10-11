"""Pin how the gateway maps FastF1 rows/frames onto entities (NaN, missing columns, units)."""
from types import SimpleNamespace

import pandas as pd

from entities.session import DriverResult, Lap
from entities.telemetry import TelemetryPoint
from frameworks_drivers.fastf1_gateway.gateway import FastF1Gateway

NAN = float("nan")


def _gateway_with(session) -> FastF1Gateway:
    gateway = FastF1Gateway()
    gateway._load_session = lambda *args, **kwargs: session
    return gateway


def test_driver_result_maps_all_columns():
    row = pd.Series({
        "Abbreviation": "VER", "FullName": "Max Verstappen", "TeamName": "Red Bull",
        "Position": 1.0, "Points": 25.0, "Status": "Finished", "GridPosition": 2.0,
    })

    assert FastF1Gateway._driver_result_from_row(row) == DriverResult(
        driver="VER", driver_name="Max Verstappen", team="Red Bull",
        position=1, points=25.0, status="Finished", grid_position=2,
    )


def test_driver_result_defaults_nan_numbers():
    row = pd.Series({
        "Abbreviation": "VER", "FullName": "Max Verstappen", "TeamName": "Red Bull",
        "Position": NAN, "Points": NAN, "Status": "Retired", "GridPosition": NAN,
    })

    result = FastF1Gateway._driver_result_from_row(row)

    assert (result.position, result.points, result.grid_position) == (None, 0.0, None)


def test_driver_result_defaults_missing_columns():
    result = FastF1Gateway._driver_result_from_row(pd.Series({"Abbreviation": "VER"}))

    assert result == DriverResult(
        driver="VER", driver_name=None, team="Unknown",
        position=None, points=0.0, status="Unknown", grid_position=None,
    )


def test_get_session_data_maps_laps_to_seconds_since_green_flag():
    laps = pd.DataFrame({
        "Driver": ["VER", "VER"],
        "LapNumber": [1.0, 2.0],
        "LapTime": [pd.Timedelta(seconds=90), pd.NaT],
        "Position": [1.0, 1.0],
        "Compound": ["SOFT", "SOFT"],
        "Team": ["Red Bull", "Red Bull"],
        "Sector1Time": [pd.Timedelta(seconds=30), pd.Timedelta(seconds=31)],
        "Sector2Time": [pd.Timedelta(seconds=30), pd.NaT],
        "Sector3Time": [pd.NaT, pd.NaT],
        "LapStartTime": [pd.Timedelta(seconds=10), pd.Timedelta(seconds=100)],
    })
    session = SimpleNamespace(
        laps=laps,
        results=pd.DataFrame(),
        event={"EventName": "Test GP", "Country": "Nowhere", "Location": "Circuit"},
    )

    data = _gateway_with(session).get_session_data(2026, 1, "R")

    assert data.laps == [Lap(
        driver="VER", lap_number=1, lap_time=90.0, position=1, compound="SOFT", team="Red Bull",
        sector_1_time=30.0, sector_2_time=30.0, sector_3_time=None, session_time=0.0,
    )]
    assert data.total_laps == 2
    assert data.results == []


def test_get_session_data_labels_missing_compound_unknown():
    laps = pd.DataFrame({
        "Driver": ["VER"], "LapNumber": [1], "LapTime": [pd.Timedelta(seconds=90)],
        "Compound": [None], "LapStartTime": [pd.Timedelta(seconds=0)],
    })
    session = SimpleNamespace(
        laps=laps, results=pd.DataFrame(),
        event={"EventName": "Test GP", "Country": "Nowhere", "Location": "Circuit"},
    )

    data = _gateway_with(session).get_session_data(2026, 1, "R")

    assert data.laps[0].compound == "UNKNOWN"


def test_get_weather_reads_latest_row_and_nulls_nan():
    weather = pd.DataFrame({
        "AirTemp": [20.0, 25.0], "TrackTemp": [30.0, NAN], "Humidity": [50.0, 55.0],
        "Pressure": [1000.0, 1010.0], "Rainfall": [False, True],
        "WindSpeed": [1.0, 2.0], "WindDirection": [90.0, 180.0],
    })

    result = _gateway_with(SimpleNamespace(weather_data=weather)).get_weather(2026, 1)

    assert (result.air_temp, result.track_temp, result.humidity) == (25.0, None, 55.0)
    assert (result.pressure, result.rainfall) == (1010.0, True)
    assert (result.wind_speed, result.wind_direction) == (2.0, 180.0)


class _LapsFrame(pd.DataFrame):
    def pick_driver(self, code):
        return self[self["Driver"] == code]


def test_get_telemetry_maps_channels_and_defaults_missing_values():
    laps = _LapsFrame({
        "Driver": ["VER"], "DriverNumber": ["1"], "LapNumber": [1],
        "LapStartTime": [pd.Timedelta(seconds=0)],
    })
    car = pd.DataFrame({
        "SessionTime": [pd.Timedelta(seconds=0.0), pd.Timedelta(seconds=0.5)],
        "Speed": [200.0, NAN], "Throttle": [100.0, NAN], "Brake": [False, NAN],
        "nGear": [7, NAN], "RPM": [11000.0, NAN], "DRS": [12, NAN],
    })

    data = _gateway_with(SimpleNamespace(laps=laps, car_data={"1": car})).get_telemetry(2026, 1, "R", "VER")

    assert data.points == [
        TelemetryPoint(t=0.0, speed=200.0, throttle=100.0, brake=False, gear=7, rpm=11000.0, drs=12),
        TelemetryPoint(t=0.5, speed=None, throttle=None, brake=False, gear=None, rpm=None, drs=0),
    ]
