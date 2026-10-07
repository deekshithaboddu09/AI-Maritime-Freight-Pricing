import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.agents.customs_agent import CustomsAgent


class TestCustomsAgent(unittest.TestCase):

    def setUp(self):
        self.agent = CustomsAgent()

    def test_domestic_general_cargo(self):
        """Test domestic general cargo shipment has 0 corridor points and LOW risk."""
        result = self.agent.validate_customs(
            origin_country="India",
            destination_country="India",
            cargo_type="General Cargo",
            containers=10,
            route_id=6
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["trade_type"], "Domestic")
        self.assertEqual(result["customs_risk_level"], "LOW")
        self.assertEqual(result["validation_status"], "VALID")
        self.assertEqual(result["customs_risk_points"], 0)
        self.assertFalse(result["special_clearance_required"])
        self.assertEqual(len(result["missing_documents"]), 0)
        self.assertEqual(result["route_id"], 6)

    def test_international_general_cargo(self):
        """Test international general cargo adds 1 corridor point and remains LOW risk."""
        result = self.agent.validate_customs(
            origin_country="India",
            destination_country="China",
            cargo_type="General Cargo",
            containers=15,
            route_id="R001"
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["trade_type"], "International")
        self.assertEqual(result["customs_risk_points"], 1)
        self.assertEqual(result["customs_risk_level"], "LOW")
        self.assertEqual(result["validation_status"], "VALID")
        self.assertIn("Commercial Invoice", result["required_documents"])

    def test_bulk_cargo(self):
        """Test Bulk Cargo includes weight certificate requirement and moderate risk."""
        result = self.agent.validate_customs(
            origin_country="UAE",
            destination_country="Sri Lanka",
            cargo_type="Bulk Cargo",
            containers=20
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["trade_type"], "International")
        self.assertEqual(result["customs_risk_points"], 2)  # 1 corridor + 1 bulk
        self.assertEqual(result["customs_risk_level"], "LOW")
        self.assertTrue(any("Weight" in doc for doc in result["required_documents"]))

    def test_refrigerated_cargo(self):
        """Test Refrigerated Cargo requires special clearance and cold-chain/phytosanitary docs."""
        result = self.agent.validate_customs(
            origin_country="Spain",
            destination_country="Australia",
            cargo_type="Refrigerated Cargo",
            containers=25
        )

        self.assertEqual(result["status"], "success")
        self.assertTrue(result["special_clearance_required"])
        self.assertEqual(result["customs_risk_points"], 3)  # 1 corridor + 2 refrigerated
        self.assertEqual(result["customs_risk_level"], "MEDIUM")
        self.assertEqual(result["validation_status"], "CONDITIONAL")
        self.assertTrue(any("Phytosanitary" in doc for doc in result["required_documents"]))
        self.assertTrue(any("Temperature" in doc for doc in result["required_documents"]))

    def test_liquid_cargo(self):
        """Test Liquid Cargo requires MSDS and hazardous cargo permit."""
        result = self.agent.validate_customs(
            origin_country="Singapore",
            destination_country="Hong Kong",
            cargo_type="Liquid Cargo",
            containers=20
        )

        self.assertEqual(result["status"], "success")
        self.assertTrue(result["special_clearance_required"])
        self.assertEqual(result["customs_risk_points"], 4)  # 1 corridor + 3 liquid
        self.assertEqual(result["customs_risk_level"], "MEDIUM")
        self.assertEqual(result["validation_status"], "CONDITIONAL")
        self.assertTrue(any("MSDS" in doc for doc in result["required_documents"]))
        self.assertTrue(any("Hazardous" in doc for doc in result["required_documents"]))

    def test_missing_documents_triggers_high_risk(self):
        """Test declaring incomplete documents flags missing documents and raises risk to HIGH."""
        result = self.agent.validate_customs(
            origin_country="Netherlands",
            destination_country="USA",
            cargo_type="Container",
            containers=10,
            declared_documents=["Commercial Invoice"]  # missing Packing List, Bill of Lading, Seal Verification
        )

        self.assertEqual(result["status"], "success")
        self.assertGreater(len(result["missing_documents"]), 0)
        self.assertEqual(result["customs_risk_level"], "HIGH")
        self.assertEqual(result["validation_status"], "DOCUMENTATION_REQUIRED")
        self.assertIn("Missing required documentation", result["clearance_recommendation"])

    def test_all_declared_documents_provided(self):
        """Test that providing all required documents results in zero missing documents."""
        profile_docs = [
            "Commercial Invoice",
            "Packing List",
            "Bill of Lading",
            "Container Seal Verification"
        ]

        result = self.agent.validate_customs(
            origin_country="Netherlands",
            destination_country="USA",
            cargo_type="Container",
            containers=10,
            declared_documents=profile_docs
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(len(result["missing_documents"]), 0)
        self.assertEqual(result["customs_risk_level"], "LOW")
        self.assertEqual(result["validation_status"], "VALID")

    def test_high_volume_shipment(self):
        """Test containers > 50 adds a volume scrutiny point."""
        result_standard = self.agent.validate_customs(
            origin_country="India",
            destination_country="China",
            cargo_type="General Cargo",
            containers=30
        )

        result_high_vol = self.agent.validate_customs(
            origin_country="India",
            destination_country="China",
            cargo_type="General Cargo",
            containers=75
        )

        self.assertEqual(
            result_high_vol["customs_risk_points"],
            result_standard["customs_risk_points"] + 1
        )

    def test_invalid_inputs(self):
        """Test error responses for empty countries or non-positive containers."""
        res1 = self.agent.validate_customs("", "USA", "General Cargo", 10)
        self.assertEqual(res1["status"], "error")

        res2 = self.agent.validate_customs("USA", "", "General Cargo", 10)
        self.assertEqual(res2["status"], "error")

        res3 = self.agent.validate_customs("USA", "India", "General Cargo", 0)
        self.assertEqual(res3["status"], "error")

        res4 = self.agent.validate_customs("USA", "India", "General Cargo", -5)
        self.assertEqual(res4["status"], "error")


if __name__ == "__main__":
    unittest.main()
