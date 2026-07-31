from datetime import datetime, timedelta

from frameworks_drivers.system_clock import SystemClock


def test_system_clock_now_returns_current_time():
    clock = SystemClock()
    before = datetime.now()
    result = clock.now()
    after = datetime.now()
    assert before - timedelta(seconds=1) <= result <= after + timedelta(seconds=1)
