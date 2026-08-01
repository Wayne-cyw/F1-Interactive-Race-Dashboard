from entities.session import DriverResult, Lap, SessionData
from interface_adapters.presenters.team_colors import team_color


def present_lap(lap: Lap) -> dict:
    return {
        "driver": lap.driver,
        "lap_number": lap.lap_number,
        "lap_time": lap.lap_time,
        "position": lap.position,
        "compound": lap.compound,
        "team": lap.team,
        "sector_1_time": lap.sector_1_time,
        "sector_2_time": lap.sector_2_time,
        "sector_3_time": lap.sector_3_time,
        "gap_to_leader": lap.gap_to_leader,
    }


def present_result(result: DriverResult) -> dict:
    return {
        "driver": result.driver,
        "driver_name": result.driver_name,
        "team": result.team,
        "team_color": team_color(result.team),
        "position": result.position,
        "points": result.points,
        "status": result.status,
    }


def present_session(data: SessionData) -> dict:
    return {
        "status": "success",
        "session": {
            "name": data.session_info.name,
            "country": data.session_info.country,
            "location": data.session_info.location,
            "session_type": data.session_info.session_type,
        },
        "laps": [present_lap(lap) for lap in data.laps],
        "results": [present_result(r) for r in data.results],
        "total_laps": data.total_laps,
    }
