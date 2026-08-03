from entities.track import TrackLayout


def present_track(layout: TrackLayout) -> dict:
    return {
        "status": "success",
        "track": {
            "name": layout.name,
            "location": layout.location,
            "country": layout.country,
            "coordinates": [{"x": p.x, "y": p.y, "z": p.z} for p in layout.coordinates],
        },
    }
