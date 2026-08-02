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
                "pit_in_time": e.pit_in_time,
                "pit_out_time": e.pit_out_time,
            }
            for e in events
        ],
    }
