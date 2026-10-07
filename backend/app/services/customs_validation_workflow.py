from typing import Any, List, Optional, Union
from app.agents.customs_agent import CustomsAgent


class CustomsValidationWorkflow:
    """
    Customs Validation Workflow Service.

    Coordinates customs validation for shipments by leveraging CustomsAgent.
    Identifies document completeness (required, declared, missing),
    special clearance prerequisites, customs risk levels, and validation statuses.
    Designed to be cleanly consumed by higher-level services like ShipmentRiskReport.
    """

    def __init__(self, customs_agent: Optional[CustomsAgent] = None):
        self.customs_agent = customs_agent or CustomsAgent()

    def validate_shipment_customs(
        self,
        origin_country: str,
        destination_country: str,
        cargo_type: str,
        containers: int,
        route_id: Optional[Union[int, str]] = None,
        declared_documents: Optional[List[str]] = None
    ) -> dict:
        """
        Executes customs validation workflow for a given shipment.

        Parameters:
            origin_country: Country of origin
            destination_country: Country of destination
            cargo_type: Shipment cargo type (e.g., General Cargo, Bulk Cargo, Liquid Cargo, etc.)
            containers: Container quantity
            route_id: Optional route identifier
            declared_documents: Optional list of documents provided by customer

        Returns:
            Structured dictionary containing full validation status and risk details.
        """
        declared_list = list(declared_documents) if declared_documents is not None else []

        agent_result = self.customs_agent.validate_customs(
            origin_country=origin_country,
            destination_country=destination_country,
            cargo_type=cargo_type,
            containers=containers,
            route_id=route_id,
            declared_documents=declared_documents
        )

        if agent_result.get("status") != "success":
            return {
                "status": "error",
                "route_id": route_id,
                "trade_type": None,
                "cargo_type": cargo_type,
                "required_documents": [],
                "declared_documents": declared_list,
                "missing_documents": [],
                "special_clearance_required": False,
                "customs_risk_points": 0,
                "customs_risk_level": "UNKNOWN",
                "validation_status": "ERROR",
                "clearance_recommendation": agent_result.get(
                    "message", "Customs validation failed."
                ),
                "message": agent_result.get(
                    "message", "Customs validation failed."
                )
            }

        return {
            "status": "success",
            "route_id": agent_result.get("route_id"),
            "trade_type": agent_result.get("trade_type"),
            "cargo_type": agent_result.get("cargo_type"),
            "required_documents": agent_result.get("required_documents", []),
            "declared_documents": declared_list,
            "missing_documents": agent_result.get("missing_documents", []),
            "special_clearance_required": agent_result.get(
                "special_clearance_required", False
            ),
            "customs_risk_points": agent_result.get("customs_risk_points", 0),
            "customs_risk_level": agent_result.get("customs_risk_level", "LOW"),
            "validation_status": agent_result.get("validation_status", "VALID"),
            "clearance_recommendation": agent_result.get(
                "clearance_recommendation", ""
            )
        }

    def validate(
        self,
        origin_country: str,
        destination_country: str,
        cargo_type: str,
        containers: int,
        route_id: Optional[Union[int, str]] = None,
        declared_documents: Optional[List[str]] = None
    ) -> dict:
        """Alias for validate_shipment_customs."""
        return self.validate_shipment_customs(
            origin_country=origin_country,
            destination_country=destination_country,
            cargo_type=cargo_type,
            containers=containers,
            route_id=route_id,
            declared_documents=declared_documents
        )
