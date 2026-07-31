from datetime import datetime

from interface_adapters.gateways.clock import Clock


class FakeClock(Clock):
    def __init__(self, fixed_now: datetime):
        self._fixed_now = fixed_now

    def now(self) -> datetime:
        return self._fixed_now
