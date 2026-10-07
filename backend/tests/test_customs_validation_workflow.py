import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.customs_validation_workflow import CustomsValidationWorkflow


class TestCustomsValidationWorkflow(unittest.TestCase):

    def setUp(self):
        self.workflow = CustomsValidationWorkflow()

    def test_all_required_documents_present(self):
        """Test workflow when all required documents are declared."""
        declared = [
            "Commercial Invoice",
            "Packing List",
            "Bill of Lading",
            "Customs Export/Import Declaration"
        ]

        result = self.workflow.validate_shipment_customs(
            origin_country="India",
            destination_country="China",
            cargo_type="General Cargo",
            containers=15,
            route_id=1,
            declared_documents=declared
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["route_id"], 1)
        self.assertEqual(result["trade_type"], "International")
        self.assertEqual(result["cargo_type"], "General Cargo")
        self.assertEqual(result["declared_documents"], declared)
        self.assertEqual(result["missing_documents"], [])
        self.assertFalse(result["special_clearance_required"])
        self.assertEqual(result["validation_status"], "VALID")
        self.assertEqual(result["customs_risk_level"], "LOW")
        self.assertIn("Standard customs documentation in order", result["clearance_recommendation"])

    def test_missing_documents(self):
        """Test workflow flags missing documents, sets DOCUMENTATION_REQUIRED and raises risk."""
        declared = ["Commercial Invoice"]

        result = self.workflow.validate_shipment_customs(
            origin_country="Netherlands",
            destination_country="USA",
            cargo_type="Container",
            containers=10,
            route_id=3,
            declared_documents=declared
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["declared_documents"], declared)
        self.assertIn("Packing List", result["missing_documents"])
        self.assertIn("Bill of Lading", result["missing_documents"])
        self.assertIn("Container Seal Verification", result["missing_documents"])
        self.assertEqual(result["validation_status"], "DOCUMENTATION_REQUIRED")
        self.assertEqual(result["customs_risk_level"], "HIGH")
        self.assertIn("Missing required documentation", result["clearance_recommendation"])

    def test_special_clearance_cargo(self):
        """Test special-clearance cargo (Liquid Cargo and Refrigerated Cargo)."""
        # Refrigerated cargo
        result_refrig = self.workflow.validate_shipment_customs(
            origin_country="Spain",
            destination_country="Australia",
            cargo_type="Refrigerated Cargo",
            containers=20
        )
        self.assertEqual(result_refrig["status"], "success")
        self.assertTrue(result_refrig["special_clearance_required"])
        self.assertEqual(result_refrig["validation_status"], "CONDITIONAL")
        self.assertEqual(result_refrig["customs_risk_level"], "MEDIUM")
        self.assertTrue(any("Phytosanitary" in doc for doc in result_refrig["required_documents"]))

        # Liquid cargo
        result_liquid = self.workflow.validate_shipment_customs(
            origin_country="Singapore",
            destination_country="Hong Kong",
            cargo_type="Liquid Cargo",
            containers=20
        )
        self.assertEqual(result_liquid["status"], "success")
        self.assertTrue(result_liquid["special_clearance_required"])
        self.assertEqual(result_liquid["validation_status"], "CONDITIONAL")
        self.assertEqual(result_liquid["customs_risk_level"], "MEDIUM")
        self.assertTrue(any("MSDS" in doc for doc in result_liquid["required_documents"]))
        self.assertTrue(any("Hazardous" in doc for doc in result_liquid["required_documents"]))

    def test_domestic_shipment(self):
        """Test domestic shipment identification and low risk."""
        result = self.workflow.validate_shipment_customs(
            origin_country="India",
            destination_country="India",
            cargo_type="General Cargo",
            containers=10,
            route_id=6
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["trade_type"], "Domestic")
        self.assertEqual(result["customs_risk_points"], 0)
        self.assertEqual(result["customs_risk_level"], "LOW")
        self.assertEqual(result["validation_status"], "VALID")
        self.assertFalse(result["special_clearance_required"])

    def test_international_shipment(self):
        """Test international shipment identification and corridor risk point."""
        result = self.workflow.validate_shipment_customs(
            origin_country="Germany",
            destination_country="India",
            cargo_type="General Cargo",
            containers=15,
            route_id=10
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["trade_type"], "International")
        self.assertEqual(result["customs_risk_points"], 1)
        self.assertEqual(result["customs_risk_level"], "LOW")
        self.assertEqual(result["validation_status"], "VALID")

    def test_invalid_input(self):
        """Test workflow error handling on invalid origin, destination, or containers."""
        # Empty origin
        res_empty_origin = self.workflow.validate_shipment_customs(
            origin_country="",
            destination_country="USA",
            cargo_type="General Cargo",
            containers=10
        )
        self.assertEqual(res_empty_origin["status"], "error")
        self.assertEqual(res_empty_origin["validation_status"], "ERROR")
        self.assertIn("Origin country is required", res_empty_origin["message"])

        # Empty destination
        res_empty_dest = self.workflow.validate_shipment_customs(
            origin_country="USA",
            destination_country="",
            cargo_type="General Cargo",
            containers=10
        )
        self.assertEqual(res_empty_dest["status"], "error")
        self.assertEqual(res_empty_dest["validation_status"], "ERROR")

        # Zero or negative containers
        res_zero_containers = self.workflow.validate_shipment_customs(
            origin_country="USA",
            destination_country="China",
            cargo_type="General Cargo",
            containers=0
        )
        self.assertEqual(res_zero_containers["status"], "error")
        self.assertEqual(res_zero_containers["validation_status"], "ERROR")
        self.assertIn("greater than zero", res_zero_containers["message"])

    def test_alias_method(self):
        """Test that validate() alias works identically to validate_shipment_customs()."""
        res1 = self.workflow.validate(
            origin_country="India",
            destination_country="China",
            cargo_type="General Cargo",
            containers=5
        )
        res2 = self.workflow.validate_shipment_customs(
            origin_country="India",
            destination_country="China",
            cargo_type="General Cargo",
            containers=5
        )
        self.assertEqual(res1, res2)


if __name__ == "__main__":
    unittest.main()
