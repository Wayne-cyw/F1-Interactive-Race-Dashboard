TEAM_COLORS = {
    "Red Bull Racing": "#3671C6",
    "Ferrari": "#DC2F02",
    "Mercedes": "#27F4D2",
    "McLaren": "#FAA307",
    "Aston Martin": "#229971",
    "Alpine": "#FF87BC",
    "Williams": "#64C4FF",
    "AlphaTauri": "#5E8FAA",
    "Alfa Romeo": "#9D0208",
    "Haas F1 Team": "#B6BABD",
    "RB": "#6692FF",
    "Kick Sauber": "#52E252",
}


def team_color(team_name: str) -> str:
    return TEAM_COLORS.get(team_name, "#FFFFFF")
