from entities.telemetry import TelemetryData


def present_telemetry(t: TelemetryData) -> dict:
    return {
        "status": "success",
        "driver": t.driver,
        "lap_number": t.lap_number,
        "lap_time": t.lap_time,
        "telemetry": [
            {
                "distance": p.distance,
                "speed": p.speed,
                "throttle": p.throttle,
                "brake": p.brake,
                "gear": p.gear,
                "rpm": p.rpm,
                "drs": p.drs,
            }
            for p in t.points
        ],
    }
