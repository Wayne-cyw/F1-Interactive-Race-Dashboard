from entities.calendar import RaceEvent


def present_races(year: int, races: list[RaceEvent]) -> dict:
    return {
        "status": "success",
        "year": year,
        "races": [
            {
                "round": r.round,
                "name": r.name,
                "country": r.country,
                "location": r.location,
                "date": r.date,
            }
            for r in races
        ],
    }
