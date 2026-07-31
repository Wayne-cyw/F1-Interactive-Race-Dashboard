from interface_adapters.gateways.clock import Clock


class GetSeasonsUseCase:
    def __init__(self, clock: Clock):
        self._clock = clock

    def execute(self) -> list[int]:
        current_year = self._clock.now().year
        return list(range(current_year, 2017, -1))
