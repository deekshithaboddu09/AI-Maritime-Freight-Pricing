import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.risk_service import ShipmentRiskService, RiskService


class TestShipmentRiskService(unittest.TestCase):

    def setUp(self):
        self.service = ShipmentRiskService()

    def test_low_overall_risk(self):
        """Test overall LOW risk when both Weather and Customs are LOW."""
        # Route 7 has Good weather (0 points, LOW)
        # Domestic General Cargo has 0 customs points (LOW)
        result = self.service.generate_risk_report(
            route_id=7,
            origin_country="India",
            destination_country="India",
            cargo_type="General Cargo",
            containers=10
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["overall_risk_level"], "LOW")
        self.assertEqual(result["total_risk_points"], 0)
        self.assertEqual(result["weather_risk"]["risk_level"], "LOW")
        self.assertEqual(result["customs_risk"]["customs_risk_level"], "LOW")
        self.assertIn("Shipment risk is LOW", result["risk_summary"])

    def test_medium_overall_risk(self):
        """Test overall MEDIUM risk when Weather is MEDIUM or total points >= 7."""
        # Route 1 has Moderate weather (7 points, MEDIUM)
        # International General Cargo has 1 point (LOW)
        # Total points = 8 (>= 7)
        result = self.service.generate_risk_report(
            route_id=1,
            origin_country="India",
            destination_country="China",
            cargo_type="General Cargo",
            containers=15
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["overall_risk_level"], "MEDIUM")
        self.assertEqual(result["total_risk_points"], 8)
        self.assertEqual(result["weather_risk"]["risk_level"], "MEDIUM")
        self.assertEqual(result["customs_risk"]["customs_risk_level"], "LOW")
        self.assertIn("Shipment risk is MEDIUM", result["risk_summary"])

    def test_weather_high_causing_overall_high(self):
        """Test that Weather HIGH forces overall risk to HIGH even if Customs is LOW."""
        # Route 2 has Stormy weather (11 points, HIGH)
        # Domestic General Cargo has 0 customs points (LOW)
        result = self.service.generate_risk_report(
            route_id=2,
            origin_country="India",
            destination_country="India",
            cargo_type="General Cargo",
            containers=10
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["weather_risk"]["risk_level"], "HIGH")
        self.assertEqual(result["customs_risk"]["customs_risk_level"], "LOW")
        self.assertEqual(result["overall_risk_level"], "HIGH")
        self.assertEqual(result["total_risk_points"], 11)
        self.assertIn("Shipment risk is HIGH", result["risk_summary"])

    def test_customs_high_causing_overall_high(self):
        """Test that Customs HIGH forces overall risk to HIGH even if Weather is LOW."""
        # Route 7 has Good weather (0 points, LOW)
        # Missing required documents forces Customs to HIGH
        result = self.service.generate_risk_report(
            route_id=7,
            origin_country="Netherlands",
            destination_country="USA",
            cargo_type="Container",
            containers=10,
            declared_documents=["Commercial Invoice"]  # missing Packing List, Bill of Lading, Seal Verification
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["weather_risk"]["risk_level"], "LOW")
        self.assertEqual(result["customs_risk"]["customs_risk_level"], "HIGH")
        self.assertEqual(result["customs_risk"]["validation_status"], "DOCUMENTATION_REQUIRED")
        self.assertEqual(result["overall_risk_level"], "HIGH")
        self.assertIn("Shipment risk is HIGH", result["risk_summary"])

    def test_combined_risk_points_calculation(self):
        """Test exact calculation of total_risk_points = weather_points + customs_points."""
        # Route 1: 7 weather points
        # Bulk Cargo international: 1 corridor + 1 cargo = 2 customs points
        # Total = 9
        result = self.service.generate_risk_report(
            route_id=1,
            origin_country="UAE",
            destination_country="Sri Lanka",
            cargo_type="Bulk Cargo",
            containers=20
        )

        self.assertEqual(result["status"], "success")
        expected_weather_pts = result["weather_risk"]["risk_points"]
        expected_customs_pts = result["customs_risk"]["customs_risk_points"]
        self.assertEqual(result["total_risk_points"], expected_weather_pts + expected_customs_pts)
        self.assertEqual(result["total_risk_points"], 9)
        self.assertEqual(result["overall_risk_level"], "MEDIUM")

    def test_high_points_threshold_causes_high(self):
        """Test that total_risk_points >= 12 results in HIGH even if neither is individually HIGH."""
        # Mock weather with 7 points (MEDIUM) + customs with 5 points (MEDIUM) = 12 points
        result = self.service.generate_risk_report(
            route_id=1,  # 7 weather points (MEDIUM)
            origin_country="Spain",
            destination_country="Australia",
            cargo_type="Liquid Cargo",  # 1 corridor + 3 liquid + 1 high volume (>50) = 5 customs points (MEDIUM)
            containers=60
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["weather_risk"]["risk_points"], 7)
        self.assertEqual(result["customs_risk"]["customs_risk_points"], 5)
        self.assertEqual(result["total_risk_points"], 12)
        self.assertEqual(result["overall_risk_level"], "HIGH")

    def test_recommendation_generation(self):
        """Test operational recommendations synthesize weather, customs, and operations guidance."""
        result = self.service.generate_risk_report(
            route_id=2,  # HIGH weather
            origin_country="Spain",
            destination_country="Australia",
            cargo_type="Refrigerated Cargo",
            containers=20
        )

        self.assertEqual(result["status"], "success")
        recs = result["operational_recommendations"]
        self.assertGreaterEqual(len(recs), 2)
        self.assertTrue(any(r.startswith("Weather:") for r in recs))
        self.assertTrue(any(r.startswith("Customs:") for r in recs))
        self.assertTrue(any("Operations:" in r for r in recs))

    def test_missing_or_invalid_inputs(self):
        """Test error handling when required inputs are missing or invalid."""
        # Missing origin
        res1 = self.service.generate_risk_report(
            route_id=1,
            origin_country="",
            destination_country="USA",
            cargo_type="General Cargo",
            containers=10
        )
        self.assertEqual(res1["status"], "error")
        self.assertEqual(res1["overall_risk_level"], "UNKNOWN")

        # Missing destination
        res2 = self.service.generate_risk_report(
            route_id=1,
            origin_country="USA",
            destination_country="",
            cargo_type="General Cargo",
            containers=10
        )
        self.assertEqual(res2["status"], "error")

        # Zero or negative containers
        res3 = self.service.generate_risk_report(
            route_id=1,
            origin_country="USA",
            destination_country="China",
            cargo_type="General Cargo",
            containers=0
        )
        self.assertEqual(res3["status"], "error")

    def test_missing_weather_route_safe_fallback(self):
        """Test that non-existent route IDs do not crash the service and fall back safely."""
        result = self.service.generate_risk_report(
            route_id=9999,  # Non-existent in weather.csv
            origin_country="India",
            destination_country="India",
            cargo_type="General Cargo",
            containers=10
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["weather_risk"]["status"], "not_available")
        self.assertEqual(result["weather_risk"]["risk_points"], 0)
        self.assertEqual(result["overall_risk_level"], "LOW")

    def test_service_alias(self):
        """Test that RiskService is an alias of ShipmentRiskService."""
        self.assertIs(RiskService, ShipmentRiskService)


if __name__ == "__main__":
    unittest.main()
