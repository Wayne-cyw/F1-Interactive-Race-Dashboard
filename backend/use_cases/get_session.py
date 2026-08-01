from dataclasses import replace

from entities.session import Lap, SessionData
from interface_adapters.gateways.session_repository import SessionRepository


class GetSessionUseCase:
    """Fetches session data and adds an approximate gap_to_leader to each lap.

    gap_to_leader is computed per lap_number from cumulative lap times: a
    driver's cumulative time through lap N (the sum of their own recorded
    lap_time values for lap_number <= N) minus the lowest such cumulative
    time among all drivers who have a recorded lap at exactly lap_number N.
    It does not account for starting-grid time gaps, and if a driver is
    missing a lap record for some lap_number, their cumulative total from
    that point on only reflects the laps they do have data for — a known,
    documented limitation of this approximation, not a defect.

    A lap missing driver, lap_number, or lap_time is left with
    gap_to_leader=None (nothing to compute from).
    """

    def __init__(self, repo: SessionRepository):
        self._repo = repo

    def execute(self, year: int, race_round: int, session_type: str) -> SessionData:
        data = self._repo.get_session_data(year, race_round, session_type)
        laps_with_gap = self._with_gap_to_leader(data.laps)
        return SessionData(
            session_info=data.session_info,
            laps=laps_with_gap,
            results=data.results,
            total_laps=data.total_laps,
            race_duration_seconds=self._race_duration_seconds(laps_with_gap),
        )

    @staticmethod
    def _race_duration_seconds(laps: list[Lap]) -> float:
        candidates = [
            lap.session_time + lap.lap_time
            for lap in laps
            if lap.session_time is not None and lap.lap_time is not None
        ]
        return max(candidates) if candidates else 0.0

    @staticmethod
    def _with_gap_to_leader(laps: list[Lap]) -> list[Lap]:
        valid = [lap for lap in laps if lap.driver is not None and lap.lap_number is not None and lap.lap_time is not None]

        cumulative_by_driver_lap: dict[tuple[str, int], float] = {}
        running_total: dict[str, float] = {}
        for lap in sorted(valid, key=lambda l: (l.driver, l.lap_number)):
            running_total[lap.driver] = running_total.get(lap.driver, 0.0) + lap.lap_time
            cumulative_by_driver_lap[(lap.driver, lap.lap_number)] = running_total[lap.driver]

        leader_by_lap_number: dict[int, float] = {}
        for (_driver, lap_number), cumulative in cumulative_by_driver_lap.items():
            if lap_number not in leader_by_lap_number or cumulative < leader_by_lap_number[lap_number]:
                leader_by_lap_number[lap_number] = cumulative

        result = []
        for lap in laps:
            key = (lap.driver, lap.lap_number)
            if key not in cumulative_by_driver_lap:
                result.append(lap)
                continue
            gap = cumulative_by_driver_lap[key] - leader_by_lap_number[lap.lap_number]
            result.append(replace(lap, gap_to_leader=gap))
        return result
