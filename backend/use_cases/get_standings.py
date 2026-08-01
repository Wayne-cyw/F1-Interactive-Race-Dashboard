from entities.errors import SessionNotFoundError
from entities.standing import ConstructorStanding, DriverStanding, StandingsData
from interface_adapters.gateways.standings_repository import StandingsRepository


class GetStandingsUseCase:
    def __init__(self, repo: StandingsRepository):
        self._repo = repo

    def execute(self, year: int) -> StandingsData:
        completed_rounds = self._repo.get_completed_rounds(year)
        if not completed_rounds:
            raise SessionNotFoundError(f"No completed races in {year} yet")
        latest_round = completed_rounds[-1]

        driver_totals: dict[str, dict] = {}
        team_totals: dict[str, float] = {}
        for round_num in range(1, latest_round + 1):
            try:
                results = self._repo.get_round_results(year, round_num)
            except Exception:
                continue
            for result in results:
                entry = driver_totals.setdefault(
                    result.driver,
                    {"driver": result.driver, "name": result.driver_name, "team": result.team, "points": 0.0},
                )
                entry["points"] += result.points
                team_totals[result.team] = team_totals.get(result.team, 0.0) + result.points

        ranked_drivers = sorted(driver_totals.values(), key=lambda d: d["points"], reverse=True)
        ranked_teams = sorted(team_totals.items(), key=lambda kv: kv[1], reverse=True)

        driver_standings = [
            DriverStanding(driver=d["driver"], name=d["name"], team=d["team"], points=d["points"], position=i + 1)
            for i, d in enumerate(ranked_drivers)
        ]
        team_standings = [
            ConstructorStanding(team=name, points=points, position=i + 1)
            for i, (name, points) in enumerate(ranked_teams)
        ]
        return StandingsData(year=year, last_race=latest_round, driver_standings=driver_standings, team_standings=team_standings)
