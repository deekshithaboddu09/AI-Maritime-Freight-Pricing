from typing import Any, List, Optional, Union
from app.agents.weather_agent import WeatherAgent
from app.services.customs_validation_workflow import CustomsValidationWorkflow


class ShipmentRiskService:
    """
    Shipment Risk Assessment Service.

    Combines navigational weather risk from WeatherAgent with regulatory
    customs compliance risk from CustomsValidationWorkflow to produce a unified,
    actionable Shipment Risk Report.
    """

    def __init__(
        self,
        weather_agent: Optional[WeatherAgent] = None,
        customs_workflow: Optional[CustomsValidationWorkflow] = None
    ):
        self.weather_agent = weather_agent or WeatherAgent()
        self.customs_workflow = customs_workflow or CustomsValidationWorkflow()

    def _get_weather_assessment(
        self,
        route_id: Optional[Union[int, str]]
    ) -> dict:
        """
        Retrieves weather assessment for route_id, supporting numeric and string formats.
        Safely returns a default structure if data is missing or unavailable.
        """
        if route_id is None:
            return {
                "status": "not_available",
                "route_id": None,
                "risk_points": 0,
                "risk_level": "LOW",
                "recommendation": "No route identifier provided for weather assessment."
            }

        # First attempt: direct lookup
        weather_result = self.weather_agent.assess_weather(route_id)

        # Second attempt: try normalized format (e.g. 1 -> "R001" or "R001" -> 1)
        if weather_result.get("status") != "found":
            try:
                numeric_val = int(str(route_id).replace("R", "").replace("r", ""))
                formatted_r_id = f"R{numeric_val:03d}"
                retry_result = self.weather_agent.assess_weather(formatted_r_id)
                if retry_result.get("status") == "found":
                    weather_result = retry_result
                else:
                    # Also try plain integer lookup
                    retry_plain = self.weather_agent.assess_weather(numeric_val)
                    if retry_plain.get("status") == "found":
                        weather_result = retry_plain
            except (ValueError, TypeError):
                pass

        if weather_result.get("status") != "found":
            return {
                "status": "not_available",
                "route_id": str(route_id),
                "risk_points": 0,
                "risk_level": "LOW",
                "recommendation": "Weather data currently unavailable for this route."
            }

        return weather_result

    def generate_risk_report(
        self,
        route_id: Optional[Union[int, str]],
        origin_country: str,
        destination_country: str,
        cargo_type: str,
        containers: int,
        declared_documents: Optional[List[str]] = None
    ) -> dict:
        """
        Generates the combined Shipment Risk Report.

        Parameters:
            route_id: Shipping route identifier
            origin_country: Origin jurisdiction
            destination_country: Destination jurisdiction
            cargo_type: Type of cargo
            containers: Container quantity
            declared_documents: Optional list of documents declared by customer

        Returns:
            Structured dictionary containing overall risk, points, weather risk,
            customs risk, and consolidated operational recommendations.
        """
        # Validate basic shipment inputs
        if not origin_country or not str(origin_country).strip():
            return {
                "status": "error",
                "route_id": route_id,
                "overall_risk_level": "UNKNOWN",
                "total_risk_points": 0,
                "risk_summary": "Shipment risk assessment failed: Origin country is required.",
                "weather_risk": {},
                "customs_risk": {},
                "operational_recommendations": [],
                "message": "Origin country is required."
            }

        if not destination_country or not str(destination_country).strip():
            return {
                "status": "error",
                "route_id": route_id,
                "overall_risk_level": "UNKNOWN",
                "total_risk_points": 0,
                "risk_summary": "Shipment risk assessment failed: Destination country is required.",
                "weather_risk": {},
                "customs_risk": {},
                "operational_recommendations": [],
                "message": "Destination country is required."
            }

        if containers is None or containers <= 0:
            return {
                "status": "error",
                "route_id": route_id,
                "overall_risk_level": "UNKNOWN",
                "total_risk_points": 0,
                "risk_summary": "Shipment risk assessment failed: Container count must be greater than zero.",
                "weather_risk": {},
                "customs_risk": {},
                "operational_recommendations": [],
                "message": "Container count must be greater than zero."
            }

        # 1. Obtain weather risk
        weather_risk = self._get_weather_assessment(route_id)

        # 2. Obtain customs risk & validation
        customs_risk = self.customs_workflow.validate_shipment_customs(
            origin_country=origin_country,
            destination_country=destination_country,
            cargo_type=cargo_type,
            containers=containers,
            route_id=route_id,
            declared_documents=declared_documents
        )

        if customs_risk.get("status") != "success":
            return {
                "status": "error",
                "route_id": route_id,
                "overall_risk_level": "UNKNOWN",
                "total_risk_points": 0,
                "risk_summary": f"Customs validation error: {customs_risk.get('message', 'Validation failed')}",
                "weather_risk": weather_risk,
                "customs_risk": customs_risk,
                "operational_recommendations": [],
                "message": customs_risk.get("message", "Customs validation failed.")
            }

        # 3. Combine risk points
        weather_points = int(weather_risk.get("risk_points", 0))
        customs_points = int(customs_risk.get("customs_risk_points", 0))
        total_risk_points = weather_points + customs_points

        # 4. Determine overall risk level
        weather_level = str(weather_risk.get("risk_level", "LOW")).upper()
        customs_level = str(customs_risk.get("customs_risk_level", "LOW")).upper()

        if weather_level == "HIGH" or customs_level == "HIGH" or total_risk_points >= 12:
            overall_risk_level = "HIGH"
        elif weather_level == "MEDIUM" or customs_level == "MEDIUM" or total_risk_points >= 7:
            overall_risk_level = "MEDIUM"
        else:
            overall_risk_level = "LOW"

        # 5. Build consolidated operational recommendations
        recommendations = []

        w_rec = weather_risk.get("recommendation")
        if w_rec:
            recommendations.append(f"Weather: {w_rec}")

        c_rec = customs_risk.get("clearance_recommendation")
        if c_rec:
            recommendations.append(f"Customs: {c_rec}")

        if overall_risk_level == "HIGH":
            recommendations.append(
                "Operations: High shipment risk detected. Review navigational precautions and ensure all regulatory prerequisites are cleared before dispatch."
            )

        # 6. Build narrative risk summary
        if overall_risk_level == "LOW":
            risk_summary = (
                f"Shipment risk is LOW (score: {total_risk_points}). "
                "Navigational weather and customs clearance conditions are favorable."
            )
        elif overall_risk_level == "MEDIUM":
            risk_summary = (
                f"Shipment risk is MEDIUM (score: {total_risk_points}). "
                "Caution advised; monitor weather alerts and prepare supplementary clearance documentation."
            )
        else:
            risk_summary = (
                f"Shipment risk is HIGH (score: {total_risk_points}). "
                "Critical operational or regulatory risks identified; requires mandatory review prior to departure."
            )

        return {
            "status": "success",
            "route_id": route_id,
            "overall_risk_level": overall_risk_level,
            "total_risk_points": total_risk_points,
            "risk_summary": risk_summary,
            "weather_risk": weather_risk,
            "customs_risk": customs_risk,
            "operational_recommendations": recommendations
        }

    def assess_risk(
        self,
        route_id: Optional[Union[int, str]],
        origin_country: str,
        destination_country: str,
        cargo_type: str,
        containers: int,
        declared_documents: Optional[List[str]] = None
    ) -> dict:
        """Alias for generate_risk_report."""
        return self.generate_risk_report(
            route_id=route_id,
            origin_country=origin_country,
            destination_country=destination_country,
            cargo_type=cargo_type,
            containers=containers,
            declared_documents=declared_documents
        )


# Class alias for flexible imports
RiskService = ShipmentRiskService
