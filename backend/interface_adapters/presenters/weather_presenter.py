from entities.weather import WeatherData


def present_weather(w: WeatherData) -> dict:
    return {
        "status": "success",
        "weather": {
            "air_temp": w.air_temp,
            "track_temp": w.track_temp,
            "humidity": w.humidity,
            "pressure": w.pressure,
            "rainfall": w.rainfall,
            "wind_speed": w.wind_speed,
            "wind_direction": w.wind_direction,
        },
    }
