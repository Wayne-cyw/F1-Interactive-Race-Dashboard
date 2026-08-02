from entities.track_status import TrackStatusEvent


def present_track_status(events: list[TrackStatusEvent]) -> dict:
    return {
        "status": "success",
        "track_status": [{"t": e.t, "status": e.status, "message": e.message} for e in events],
    }
