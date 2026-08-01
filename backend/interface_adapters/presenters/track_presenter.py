from entities.track import TrackLayout


def present_track(layout: TrackLayout) -> dict:
    return {
        "status": "success",
        "track": {
            "name": layout.name,
            "location": layout.location,
            "country": layout.country,
            "coordinates": [{"x": p.x, "y": p.y} for p in layout.coordinates],
        },
    }
