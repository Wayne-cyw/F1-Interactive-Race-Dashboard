from entities.driver import Driver
from interface_adapters.presenters.team_colors import team_color


def present_drivers(drivers: list[Driver]) -> dict:
    return {
        "status": "success",
        "drivers": [
            {"code": d.code, "name": d.name, "team": d.team, "team_color": team_color(d.team)}
            for d in drivers
        ],
    }
