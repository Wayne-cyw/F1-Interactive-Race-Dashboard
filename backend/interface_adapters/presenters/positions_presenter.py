from entities.positions import DriverPositions


def present_positions(drivers: list[DriverPositions]) -> dict:
    return {
        "status": "success",
        "drivers": [
            {
                "driver": d.driver,
                "points": [{"t": p.t, "x": p.x, "y": p.y} for p in d.points],
            }
            for d in drivers
        ],
    }
