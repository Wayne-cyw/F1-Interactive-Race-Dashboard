from datetime import datetime

from interface_adapters.gateways.clock import Clock


class SystemClock(Clock):
    def now(self) -> datetime:
        return datetime.now()
