from entities.telemetry import TelemetryData


def present_telemetry(t: TelemetryData) -> dict:
    return {
        "status": "success",
        "driver": t.driver,
        "telemetry": [
            {
                "t": p.t,
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
