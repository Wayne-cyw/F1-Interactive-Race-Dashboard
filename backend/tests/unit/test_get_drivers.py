from entities.driver import Driver
from tests.fakes import FakeSessionRepository
from use_cases.get_drivers import GetDriversUseCase


def test_returns_driver_roster_from_repository():
    drivers = [Driver(code="VER", name="Max Verstappen", team="Red Bull Racing")]
    use_case = GetDriversUseCase(FakeSessionRepository(driver_roster=drivers))
    assert use_case.execute(2026, 1) == drivers
