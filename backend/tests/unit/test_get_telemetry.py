import pytest

from entities.errors import SessionNotFoundError
from entities.telemetry import TelemetryData, TelemetryPoint
from tests.fakes import FakeSessionRepository
from use_cases.get_telemetry import GetTelemetryUseCase


def test_returns_telemetry_from_repository():
    data = TelemetryData(driver="VER", lap_number=32, lap_time=91.234, points=[TelemetryPoint(distance=0.0, speed=290.5, throttle=100.0, brake=False, gear=7, rpm=11500.0, drs=1)])
    use_case = GetTelemetryUseCase(FakeSessionRepository(telemetry=data))
    assert use_case.execute(2026, 1, "R", "VER") == data


def test_propagates_not_found_error():
    use_case = GetTelemetryUseCase(FakeSessionRepository(telemetry_error=SessionNotFoundError("No laps found for XXX")))
    with pytest.raises(SessionNotFoundError):
        use_case.execute(2026, 1, "R", "XXX")
