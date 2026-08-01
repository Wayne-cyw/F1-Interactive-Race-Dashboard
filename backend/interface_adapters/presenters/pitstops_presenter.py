from entities.pitstop import PitStopEvent


def present_pitstops(events: list[PitStopEvent]) -> dict:
    return {
        "status": "success",
        "pit_stops": [
            {
                "driver": e.driver,
                "lap": e.lap,
                "from_compound": e.from_compound,
                "to_compound": e.to_compound,
                "pit_duration": e.pit_duration,
            }
            for e in events
        ],
    }
