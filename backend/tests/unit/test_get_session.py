from entities.session import DriverResult, Lap, SessionData, SessionInfo
from tests.fakes import FakeSessionRepository
from use_cases.get_session import GetSessionUseCase


def _session_data(laps, results=None, total_laps=57):
    return SessionData(
        session_info=SessionInfo(name="Bahrain Grand Prix", country="Bahrain", location="Sakhir", session_type="R"),
        laps=laps,
        results=results or [],
        total_laps=total_laps,
    )


def test_returns_session_data_from_repository():
    data = _session_data(
        laps=[Lap(driver="VER", lap_number=1, lap_time=91.2, position=1, compound="SOFT", team="Red Bull Racing", sector_1_time=28.4, sector_2_time=33.1, sector_3_time=29.7, session_time=0.0)],
        results=[DriverResult(driver="VER", driver_name="Max Verstappen", team="Red Bull Racing", position=1, points=25.0, status="Finished")],
    )
    use_case = GetSessionUseCase(FakeSessionRepository(session_data=data))
    result = use_case.execute(2026, 1, "R")

    assert result.session_info == data.session_info
    assert result.results == data.results
    assert result.total_laps == data.total_laps
    assert len(result.laps) == 1
    lap = result.laps[0]
    assert lap.driver == "VER"
    assert lap.sector_1_time == 28.4
    assert lap.gap_to_leader == 0.0  # sole driver in the field is trivially the leader
    assert lap.session_time == 0.0


def test_computes_gap_to_leader_across_multiple_laps_and_drivers():
    laps = [
        Lap(driver="VER", lap_number=1, lap_time=90.0),
        Lap(driver="HAM", lap_number=1, lap_time=91.0),
        Lap(driver="VER", lap_number=2, lap_time=89.0),
        Lap(driver="HAM", lap_number=2, lap_time=90.5),
    ]
    use_case = GetSessionUseCase(FakeSessionRepository(session_data=_session_data(laps, total_laps=2)))
    result = use_case.execute(2026, 1, "R")
    by_key = {(lap.driver, lap.lap_number): lap for lap in result.laps}

    assert by_key[("VER", 1)].gap_to_leader == 0.0
    assert by_key[("HAM", 1)].gap_to_leader == 1.0  # 91.0 - 90.0
    assert by_key[("VER", 2)].gap_to_leader == 0.0  # VER cumulative 179.0 is the lowest at lap 2
    assert round(by_key[("HAM", 2)].gap_to_leader, 3) == 2.5  # 181.5 - 179.0


def test_gap_to_leader_is_none_for_a_lap_missing_required_fields():
    laps = [
        Lap(driver="VER", lap_number=1, lap_time=90.0),
        Lap(driver=None, lap_number=2, lap_time=91.0),  # can't attribute this lap to a driver
    ]
    use_case = GetSessionUseCase(FakeSessionRepository(session_data=_session_data(laps, total_laps=2)))
    result = use_case.execute(2026, 1, "R")
    by_lap_number = {lap.lap_number: lap for lap in result.laps}

    assert by_lap_number[1].gap_to_leader == 0.0
    assert by_lap_number[2].gap_to_leader is None


def test_gap_to_leader_only_compares_drivers_present_at_that_lap_number():
    # HAM has no lap_number=2 row at all (e.g. a lap the gateway filtered out
    # upstream for missing LapTime). gap_to_leader is only ever compared among
    # drivers who do have a row at that exact lap_number — HAM's absence at
    # lap 2 simply removes HAM from that lap's comparison entirely, and HAM's
    # own cumulative at lap 3 only reflects the laps it actually has data for
    # (a known, documented limitation of this approximation, not a bug).
    laps = [
        Lap(driver="VER", lap_number=1, lap_time=90.0),
        Lap(driver="HAM", lap_number=1, lap_time=91.0),
        Lap(driver="VER", lap_number=2, lap_time=89.0),
        Lap(driver="VER", lap_number=3, lap_time=88.0),
        Lap(driver="HAM", lap_number=3, lap_time=90.0),
    ]
    use_case = GetSessionUseCase(FakeSessionRepository(session_data=_session_data(laps, total_laps=3)))
    result = use_case.execute(2026, 1, "R")
    by_key = {(lap.driver, lap.lap_number): lap for lap in result.laps}

    assert by_key[("VER", 2)].gap_to_leader == 0.0  # sole driver present at lap 2
    # VER cumulative at lap 3 = 90+89+88=267; HAM cumulative at lap 3 = 91+90=181
    # (HAM's own recorded laps only) — HAM's cumulative is lower purely because
    # it has one fewer recorded lap, which is the approximation's known caveat.
    assert by_key[("HAM", 3)].gap_to_leader == 0.0
    assert round(by_key[("VER", 3)].gap_to_leader, 3) == 86.0


def test_computes_race_duration_from_last_completed_lap():
    laps = [
        Lap(driver="VER", lap_number=1, lap_time=90.0, session_time=0.0),
        Lap(driver="HAM", lap_number=1, lap_time=95.0, session_time=0.0),
    ]
    use_case = GetSessionUseCase(FakeSessionRepository(session_data=_session_data(laps, total_laps=1)))
    result = use_case.execute(2026, 1, "R")
    assert result.race_duration_seconds == 95.0  # HAM's lap 1 finishes latest


def test_race_duration_is_zero_when_no_lap_has_both_fields():
    laps = [Lap(driver="VER", lap_number=1, lap_time=None, session_time=0.0)]
    use_case = GetSessionUseCase(FakeSessionRepository(session_data=_session_data(laps, total_laps=1)))
    result = use_case.execute(2026, 1, "R")
    assert result.race_duration_seconds == 0.0
