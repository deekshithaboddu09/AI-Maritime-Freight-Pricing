import os
from typing import Any, List, Optional, Union
import pandas as pd


class CustomsAgent:

    DEFAULT_CARGO_RULES = {
        "general cargo": {
            "customs_id": "C001",
            "cargo_type": "General Cargo",
            "base_risk_points": 0,
            "inspection_level": "Standard",
            "special_clearance_required": False,
            "required_documents": [
                "Commercial Invoice",
                "Packing List",
                "Bill of Lading",
                "Customs Export/Import Declaration"
            ]
        },
        "container": {
            "customs_id": "C002",
            "cargo_type": "Container",
            "base_risk_points": 0,
            "inspection_level": "Standard",
            "special_clearance_required": False,
            "required_documents": [
                "Commercial Invoice",
                "Packing List",
                "Bill of Lading",
                "Container Seal Verification"
            ]
        },
        "bulk cargo": {
            "customs_id": "C003",
            "cargo_type": "Bulk Cargo",
            "base_risk_points": 1,
            "inspection_level": "Moderate",
            "special_clearance_required": False,
            "required_documents": [
                "Commercial Invoice",
                "Packing List",
                "Bill of Lading",
                "Certified Weight Certificate"
            ]
        },
        "refrigerated cargo": {
            "customs_id": "C004",
            "cargo_type": "Refrigerated Cargo",
            "base_risk_points": 2,
            "inspection_level": "High",
            "special_clearance_required": True,
            "required_documents": [
                "Commercial Invoice",
                "Packing List",
                "Bill of Lading",
                "Temperature & Cold-Chain Log",
                "Phytosanitary Certificate"
            ]
        },
        "liquid cargo": {
            "customs_id": "C005",
            "cargo_type": "Liquid Cargo",
            "base_risk_points": 3,
            "inspection_level": "High",
            "special_clearance_required": True,
            "required_documents": [
                "Commercial Invoice",
                "Packing List",
                "Bill of Lading",
                "Material Safety Data Sheet (MSDS)",
                "Hazardous Cargo Permit"
            ]
        }
    }


    def __init__(self):
        current_file = os.path.abspath(__file__)

        app_root = os.path.dirname(
            os.path.dirname(current_file)
        )

        app_data_path = os.path.join(
            app_root,
            "data",
            "customs.csv"
        )

        backend_root = os.path.dirname(app_root)
        backend_data_path = os.path.join(
            backend_root,
            "data",
            "customs.csv"
        )

        if os.path.exists(app_data_path):
            self.customs_path = app_data_path
        elif os.path.exists(backend_data_path):
            self.customs_path = backend_data_path
        else:
            self.customs_path = app_data_path

        try:
            self.customs_data = pd.read_csv(self.customs_path)
            print("Customs dataset loaded successfully from:", self.customs_path)
        except Exception as e:
            print("Warning: Could not read customs.csv directly, using default rules. Error:", e)
            self.customs_data = None


    def _get_cargo_rule(self, cargo_type: str) -> dict:
        key = cargo_type.strip().lower()

        if self.customs_data is not None and not self.customs_data.empty:
            match = self.customs_data[
                self.customs_data["cargo_type"].astype(str).str.strip().str.lower() == key
            ]

            if not match.empty:
                row = match.iloc[0]
                raw_docs = str(row.get("required_documents", ""))
                docs_list = [d.strip() for d in raw_docs.split(";") if d.strip()]

                return {
                    "customs_id": str(row.get("customs_id", "")),
                    "cargo_type": str(row.get("cargo_type", "")),
                    "base_risk_points": int(row.get("base_risk_points", 0)),
                    "inspection_level": str(row.get("inspection_level", "Standard")),
                    "special_clearance_required": bool(str(row.get("special_clearance_required", "False")).strip().lower() == "true"),
                    "required_documents": docs_list
                }

        # Fallback to in-memory dictionary
        if key in self.DEFAULT_CARGO_RULES:
            return self.DEFAULT_CARGO_RULES[key].copy()

        # Sensible default for unlisted cargo
        return {
            "customs_id": "C_DEF",
            "cargo_type": cargo_type.title(),
            "base_risk_points": 1,
            "inspection_level": "Standard",
            "special_clearance_required": False,
            "required_documents": [
                "Commercial Invoice",
                "Packing List",
                "Bill of Lading",
                "Customs Export/Import Declaration"
            ]
        }


    def calculate_customs_risk(
        self,
        origin_country: str,
        destination_country: str,
        cargo_type: str,
        containers: int,
        missing_documents: List[str]
    ) -> tuple:
        origin_clean = origin_country.strip().lower()
        dest_clean = destination_country.strip().lower()

        is_domestic = (origin_clean == dest_clean)
        trade_type = "Domestic" if is_domestic else "International"

        # Trade corridor points
        corridor_points = 0 if is_domestic else 1

        # Cargo category points
        cargo_profile = self._get_cargo_rule(cargo_type)
        cargo_points = int(cargo_profile["base_risk_points"])

        # Volume points
        volume_points = 1 if containers > 50 else 0

        # Documentation points
        doc_points = 2 * len(missing_documents)

        total_risk_points = corridor_points + cargo_points + volume_points + doc_points

        # Classification
        if len(missing_documents) > 0 or total_risk_points >= 6:
            risk_level = "HIGH"
            validation_status = (
                "DOCUMENTATION_REQUIRED"
                if len(missing_documents) > 0
                else "SPECIAL_CLEARANCE_REQUIRED"
            )
        elif total_risk_points >= 3:
            risk_level = "MEDIUM"
            validation_status = "CONDITIONAL"
        else:
            risk_level = "LOW"
            validation_status = "VALID"

        return total_risk_points, risk_level, validation_status, trade_type


    def validate_customs(
        self,
        origin_country: str,
        destination_country: str,
        cargo_type: str,
        containers: int,
        route_id: Optional[Union[int, str]] = None,
        declared_documents: Optional[List[str]] = None
    ) -> dict:
        if not origin_country or not str(origin_country).strip():
            return {
                "status": "error",
                "message": "Origin country is required."
            }

        if not destination_country or not str(destination_country).strip():
            return {
                "status": "error",
                "message": "Destination country is required."
            }

        if containers is None or containers <= 0:
            return {
                "status": "error",
                "message": "Container count must be greater than zero."
            }

        cargo_profile = self._get_cargo_rule(cargo_type)
        required_documents = cargo_profile["required_documents"]
        special_clearance = cargo_profile["special_clearance_required"]

        # Document completeness evaluation
        missing_documents = []
        if declared_documents is not None:
            declared_normalized = {
                str(d).strip().lower() for d in declared_documents if d
            }
            for req_doc in required_documents:
                req_norm = req_doc.strip().lower()
                # Match full string or substring
                if not any(req_norm in dec or dec in req_norm for dec in declared_normalized):
                    missing_documents.append(req_doc)

        risk_points, risk_level, validation_status, trade_type = self.calculate_customs_risk(
            origin_country=origin_country,
            destination_country=destination_country,
            cargo_type=cargo_type,
            containers=containers,
            missing_documents=missing_documents
        )

        # Clearance recommendation
        if missing_documents:
            clearance_recommendation = (
                f"Missing required documentation: {', '.join(missing_documents)}. "
                "Clearance will be held until all documents are provided."
            )
        elif risk_level == "HIGH":
            clearance_recommendation = (
                "High regulatory scrutiny cargo. Verify all hazardous/perishable permits and "
                "pre-clear with port customs authorities."
            )
        elif risk_level == "MEDIUM":
            clearance_recommendation = (
                "Ensure all supplementary documentation and inspection permits are prepared prior to departure."
            )
        else:
            clearance_recommendation = (
                "Standard customs documentation in order. Proceed with normal clearance."
            )

        return {
            "status": "success",
            "route_id": route_id,
            "origin_country": origin_country.strip().title(),
            "destination_country": destination_country.strip().title(),
            "trade_type": trade_type,
            "cargo_type": cargo_profile["cargo_type"],
            "containers": int(containers),
            "customs_risk_points": int(risk_points),
            "customs_risk_level": str(risk_level),
            "validation_status": str(validation_status),
            "required_documents": required_documents,
            "missing_documents": missing_documents,
            "special_clearance_required": special_clearance,
            "clearance_recommendation": clearance_recommendation
        }
