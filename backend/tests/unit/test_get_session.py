from entities.session import DriverResult, Lap, SessionData, SessionInfo
from tests.fakes import FakeSessionRepository
from use_cases.get_session import GetSessionUseCase


def test_returns_session_data_from_repository():
    data = SessionData(
        session_info=SessionInfo(name="Bahrain Grand Prix", country="Bahrain", location="Sakhir", session_type="R"),
        laps=[Lap(driver="VER", lap_number=1, lap_time=91.2, position=1, compound="SOFT", team="Red Bull Racing")],
        results=[DriverResult(driver="VER", driver_name="Max Verstappen", team="Red Bull Racing", position=1, points=25.0, status="Finished")],
        total_laps=57,
    )
    use_case = GetSessionUseCase(FakeSessionRepository(session_data=data))
    assert use_case.execute(2026, 1, "R") == data
