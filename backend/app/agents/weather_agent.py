import os
import pandas as pd


class WeatherAgent:

    def __init__(self):
        current_file = os.path.abspath(__file__)

        app_root = os.path.dirname(
            os.path.dirname(current_file)
        )

        self.weather_path = os.path.join(
            app_root,
            "data",
            "weather.csv"
        )

        self.weather = pd.read_csv(self.weather_path)

    def calculate_risk(
        self,
        wind_speed,
        wave_height,
        visibility,
        storm_probability
    ):
        risk_points = 0

        # Wind speed risk
        if wind_speed >= 30:
            risk_points += 3
        elif wind_speed >= 25:
            risk_points += 2

        # Wave height risk
        if wave_height >= 4:
            risk_points += 3
        elif wave_height >= 3:
            risk_points += 2

        # Visibility risk
        if visibility < 10:
            risk_points += 2
        elif visibility < 15:
            risk_points += 1

        # Storm probability risk
        if storm_probability >= 40:
            risk_points += 3
        elif storm_probability >= 25:
            risk_points += 2

        # Risk classification
        if risk_points >= 10:
            risk_level = "HIGH"
        elif risk_points >= 7:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        return risk_points, risk_level

    def assess_weather(self, route_id):
        route_weather = self.weather[
            self.weather["route_id"] == route_id
        ]

        if route_weather.empty:
            return {
                "status": "not_found",
                "message": f"No weather data found for route {route_id}"
            }

        weather_data = route_weather.iloc[0]

        wind_speed = float(weather_data["wind_speed_knots"])
        wave_height = float(weather_data["wave_height_m"])
        visibility = float(weather_data["visibility_km"])
        storm_probability = float(weather_data["storm_probability"])

        risk_points, risk_level = self.calculate_risk(
            wind_speed,
            wave_height,
            visibility,
            storm_probability
        )

        if risk_level == "LOW":
            recommendation = "Proceed normally."
        elif risk_level == "MEDIUM":
            recommendation = "Monitor weather conditions."
        else:
            recommendation = (
                "Consider route review and additional risk precautions."
            )

        return {
            "status": "found",
            "route_id": str(route_id),
            "region": str(weather_data["region"]),
            "weather_condition": str(weather_data["weather_condition"]),
            "wind_speed_knots": wind_speed,
            "wave_height_m": wave_height,
            "visibility_km": visibility,
            "storm_probability": storm_probability,
            "risk_points": int(risk_points),
            "risk_level": str(risk_level),
            "recommendation": recommendation
        }