import fastf1
import pandas as pd

from entities.calendar import RaceEvent
from interface_adapters.gateways.season_repository import SeasonRepository


class FastF1Gateway(SeasonRepository):
    def get_races(self, year: int) -> list[RaceEvent]:
        schedule = fastf1.get_event_schedule(year)
        races = []
        for _, event in schedule.iterrows():
            if event["EventFormat"] == "testing":
                continue
            races.append(
                RaceEvent(
                    round=int(event["RoundNumber"]),
                    name=event["EventName"],
                    country=event["Country"],
                    location=event["Location"],
                    date=event["EventDate"].strftime("%Y-%m-%d")
                    if pd.notna(event["EventDate"])
                    else None,
                )
            )
        return races
