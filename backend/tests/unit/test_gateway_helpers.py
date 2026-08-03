from types import SimpleNamespace

import pandas as pd

from entities.positions import DriverPositions, PositionPoint
from entities.track import TrackPoint
from frameworks_drivers.fastf1_gateway.gateway import FastF1Gateway


def test_green_flag_t0_returns_earliest_lap_one_start_time():
    laps = pd.DataFrame({
        "LapNumber": [1, 1, 2],
        "LapStartTime": [pd.Timedelta(seconds=10), pd.Timedelta(seconds=5), pd.Timedelta(seconds=100)],
    })
    session = SimpleNamespace(laps=laps)
    assert FastF1Gateway._green_flag_t0(session) == pd.Timedelta(seconds=5)


def test_green_flag_t0_returns_zero_when_lap_one_start_times_all_nan():
    laps = pd.DataFrame({
        "LapNumber": [1, 1],
        "LapStartTime": [pd.NaT, pd.NaT],
    })
    session = SimpleNamespace(laps=laps)
    assert FastF1Gateway._green_flag_t0(session) == pd.Timedelta(0)


def test_green_flag_t0_returns_zero_when_column_missing():
    laps = pd.DataFrame({"LapNumber": [1, 2]})
    session = SimpleNamespace(laps=laps)
    assert FastF1Gateway._green_flag_t0(session) == pd.Timedelta(0)


def test_resample_half_second_buckets_by_half_second_and_keeps_first_row():
    df = pd.DataFrame({
        "SessionTime": [pd.Timedelta(seconds=s) for s in [0.0, 0.1, 0.6, 0.9, 1.2]],
        "X": [1, 2, 3, 4, 5],
    })
    resampled = FastF1Gateway._resample_half_second(df, "SessionTime")
    assert len(resampled) == 3
    assert list(resampled["X"]) == [1, 3, 5]


def test_resample_half_second_drops_rows_with_null_time():
    df = pd.DataFrame({
        "SessionTime": [pd.Timedelta(seconds=0.0), pd.NaT, pd.Timedelta(seconds=1.0)],
        "X": [1, 2, 3],
    })
    resampled = FastF1Gateway._resample_half_second(df, "SessionTime")
    assert len(resampled) == 2
    assert list(resampled["X"]) == [1, 3]


def test_resample_half_second_preserves_session_time_column():
    df = pd.DataFrame({
        "SessionTime": [pd.Timedelta(seconds=0.0), pd.Timedelta(seconds=1.0)],
        "X": [1, 2],
    })
    resampled = FastF1Gateway._resample_half_second(df, "SessionTime")
    assert "SessionTime" in resampled.columns


def _fake_session_for_pitstops():
    laps = pd.DataFrame({
        "Driver": ["VER", "VER", "VER"],
        "LapNumber": [1, 2, 3],
        "Compound": ["SOFT", "SOFT", "HARD"],
        "LapStartTime": [pd.Timedelta(seconds=0), pd.Timedelta(seconds=90), pd.Timedelta(seconds=200)],
        "PitInTime": [pd.NaT, pd.Timedelta(seconds=175), pd.NaT],
        "PitOutTime": [pd.NaT, pd.NaT, pd.Timedelta(seconds=195)],
    })
    return SimpleNamespace(laps=laps)


def test_get_pitstops_populates_pit_in_and_out_time_in_seconds_since_green_flag():
    gateway = FastF1Gateway()
    gateway._load_session = lambda *args, **kwargs: _fake_session_for_pitstops()

    events = gateway.get_pitstops(2026, 1)

    assert len(events) == 1
    event = events[0]
    assert event.driver == "VER"
    assert event.lap == 3
    assert event.from_compound == "SOFT"
    assert event.to_compound == "HARD"
    assert event.pit_in_time == 175.0
    assert event.pit_out_time == 195.0


def test_get_pitstops_leaves_times_null_when_fastf1_columns_are_missing_or_nan():
    laps = pd.DataFrame({
        "Driver": ["VER", "VER"],
        "LapNumber": [1, 2],
        "Compound": ["SOFT", "HARD"],
        "LapStartTime": [pd.Timedelta(seconds=0), pd.Timedelta(seconds=90)],
    })
    gateway = FastF1Gateway()
    gateway._load_session = lambda *args, **kwargs: SimpleNamespace(laps=laps)

    events = gateway.get_pitstops(2026, 1)

    assert len(events) == 1
    assert events[0].pit_in_time is None
    assert events[0].pit_out_time is None


class _FakeLap:
    empty = False

    def __init__(self, telemetry_df):
        self._telemetry = telemetry_df

    def get_telemetry(self):
        return self._telemetry


class _FakeLaps:
    def __init__(self, fastest_lap):
        self._fastest_lap = fastest_lap

    def pick_fastest(self):
        return self._fastest_lap


def test_get_track_layout_extracts_elevation():
    telemetry = pd.DataFrame({"X": [100.0, 200.0], "Y": [300.0, 400.0], "Z": [10.0, 20.0]})
    session = SimpleNamespace(
        laps=_FakeLaps(_FakeLap(telemetry)),
        event={"EventName": "Bahrain Grand Prix", "Location": "Sakhir", "Country": "Bahrain"},
    )
    gateway = FastF1Gateway()
    gateway._load_session = lambda *args, **kwargs: session

    layout = gateway.get_track_layout(2026, 1)

    assert layout.coordinates == [
        TrackPoint(x=100.0, y=300.0, z=10.0),
        TrackPoint(x=200.0, y=400.0, z=20.0),
    ]


def test_get_track_layout_defaults_elevation_to_zero_when_missing():
    telemetry = pd.DataFrame({"X": [100.0], "Y": [300.0]})
    session = SimpleNamespace(
        laps=_FakeLaps(_FakeLap(telemetry)),
        event={"EventName": "Bahrain Grand Prix", "Location": "Sakhir", "Country": "Bahrain"},
    )
    gateway = FastF1Gateway()
    gateway._load_session = lambda *args, **kwargs: session

    layout = gateway.get_track_layout(2026, 1)

    assert layout.coordinates == [TrackPoint(x=100.0, y=300.0, z=0.0)]


def _fake_session_for_positions(pos_df):
    laps = pd.DataFrame({
        "Driver": ["VER"],
        "DriverNumber": ["1"],
        "LapNumber": [1],
        "LapStartTime": [pd.Timedelta(seconds=0)],
    })
    return SimpleNamespace(drivers=["1"], pos_data={"1": pos_df}, laps=laps)


def test_get_race_positions_extracts_elevation():
    pos_df = pd.DataFrame({
        "SessionTime": [pd.Timedelta(seconds=0.0), pd.Timedelta(seconds=0.5)],
        "X": [100.0, 110.0],
        "Y": [200.0, 210.0],
        "Z": [5.0, 6.0],
    })
    gateway = FastF1Gateway()
    gateway._load_session = lambda *args, **kwargs: _fake_session_for_positions(pos_df)

    result = gateway.get_race_positions(2026, 1)

    assert result == [
        DriverPositions(driver="VER", points=[
            PositionPoint(t=0.0, x=100.0, y=200.0, z=5.0),
            PositionPoint(t=0.5, x=110.0, y=210.0, z=6.0),
        ])
    ]


def test_get_race_positions_defaults_elevation_to_zero_when_missing():
    pos_df = pd.DataFrame({
        "SessionTime": [pd.Timedelta(seconds=0.0)],
        "X": [100.0],
        "Y": [200.0],
    })
    gateway = FastF1Gateway()
    gateway._load_session = lambda *args, **kwargs: _fake_session_for_positions(pos_df)

    result = gateway.get_race_positions(2026, 1)

    assert result == [DriverPositions(driver="VER", points=[PositionPoint(t=0.0, x=100.0, y=200.0, z=0.0)])]
