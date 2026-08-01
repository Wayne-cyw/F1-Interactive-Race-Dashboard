from entities.standing import StandingsData
from interface_adapters.presenters.team_colors import team_color


def present_standings(data: StandingsData) -> dict:
    return {
        "status": "success",
        "year": data.year,
        "last_race": data.last_race,
        "driver_standings": [
            {
                "driver": d.driver,
                "name": d.name,
                "team": d.team,
                "team_color": team_color(d.team),
                "points": d.points,
                "position": d.position,
            }
            for d in data.driver_standings
        ],
        "team_standings": [
            {"team": t.team, "color": team_color(t.team), "points": t.points, "position": t.position}
            for t in data.team_standings
        ],
    }
