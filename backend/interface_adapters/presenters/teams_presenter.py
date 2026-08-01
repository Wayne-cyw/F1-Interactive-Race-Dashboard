from entities.team import Team
from interface_adapters.presenters.team_colors import team_color


def present_teams(year: int, teams: list[Team]) -> dict:
    return {
        "status": "success",
        "year": year,
        "teams": [
            {
                "name": t.name,
                "color": team_color(t.name),
                "drivers": [{"code": d.code, "name": d.name} for d in t.drivers],
            }
            for t in teams
        ],
    }
