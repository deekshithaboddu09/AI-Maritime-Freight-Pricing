import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path so app imports resolve
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.quotation_service import QuotationService


class TestQuotationServiceIntegration(unittest.TestCase):

    def setUp(self):
        self.service = QuotationService()

    def test_existing_quotation_generation_still_works(self):
        """Test that existing quotation generation works with status success and expected routes."""
        result = self.service.generate_quotation(
            origin="Chennai",
            destination="Shanghai",
            cargo_type="General Cargo",
            containers=15
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["origin"], "Chennai")
        self.assertEqual(result["destination"], "Shanghai")
        self.assertEqual(result["cargo_type"], "General Cargo")
        self.assertEqual(result["containers"], 15)
        self.assertIn("recommended_route", result)
        self.assertEqual(result["recommended_route"]["route_id"], 1)

    def test_existing_pricing_and_margin_values_are_present(self):
        """Test that all existing pricing, margin, and surcharge keys are preserved and populated."""
        result = self.service.generate_quotation(
            origin="Chennai",
            destination="Shanghai",
            cargo_type="General Cargo",
            containers=15
        )

        self.assertEqual(result["status"], "success")
        self.assertIn("base_freight_usd", result)
        self.assertIn("fuel_surcharge_usd", result)
        self.assertIn("port_charge_usd", result)
        self.assertIn("risk_surcharge_usd", result)
        self.assertIn("operating_cost_usd", result)
        self.assertIn("demand_adjusted_cost_usd", result)
        self.assertIn("customer_price_usd", result)
        self.assertIn("profit_usd", result)
        self.assertIn("target_margin_percent", result)
        self.assertIn("actual_margin_percent", result)
        self.assertIn("recommended_margin", result)
        self.assertIn("margin_options", result)
        self.assertIn("alternatives", result)
        self.assertGreater(result["customer_price_usd"], 0)

    def test_quotation_contains_weather_risk(self):
        """Test that quotation output contains weather risk information."""
        result = self.service.generate_quotation(
            origin="Chennai",
            destination="Shanghai",
            cargo_type="General Cargo",
            containers=15
        )

        self.assertIn("weather_risk", result)
        weather_risk = result["weather_risk"]
        self.assertIn("status", weather_risk)
        self.assertIn("risk_points", weather_risk)
        self.assertIn("risk_level", weather_risk)
        self.assertIn("recommendation", weather_risk)

    def test_quotation_contains_customs_risk(self):
        """Test that quotation output contains customs risk information."""
        result = self.service.generate_quotation(
            origin="Chennai",
            destination="Shanghai",
            cargo_type="General Cargo",
            containers=15
        )

        self.assertIn("customs_risk", result)
        customs_risk = result["customs_risk"]
        self.assertEqual(customs_risk["status"], "success")
        self.assertIn("trade_type", customs_risk)
        self.assertIn("validation_status", customs_risk)
        self.assertIn("required_documents", customs_risk)
        self.assertIn("customs_risk_points", customs_risk)

    def test_quotation_contains_overall_shipment_risk(self):
        """Test that quotation contains overall_risk_level and total_risk_points."""
        result = self.service.generate_quotation(
            origin="Chennai",
            destination="Shanghai",
            cargo_type="General Cargo",
            containers=15
        )

        self.assertIn("overall_risk_level", result)
        self.assertIn(result["overall_risk_level"], ["LOW", "MEDIUM", "HIGH"])
        self.assertIn("total_risk_points", result)
        self.assertIsInstance(result["total_risk_points"], int)

    def test_quotation_contains_risk_recommendations(self):
        """Test that quotation output contains risk_summary and operational_recommendations."""
        result = self.service.generate_quotation(
            origin="Chennai",
            destination="Shanghai",
            cargo_type="General Cargo",
            containers=15
        )

        self.assertIn("risk_summary", result)
        self.assertIsInstance(result["risk_summary"], str)
        self.assertGreater(len(result["risk_summary"]), 0)

        self.assertIn("operational_recommendations", result)
        self.assertIsInstance(result["operational_recommendations"], list)
        self.assertGreater(len(result["operational_recommendations"]), 0)

    def test_invalid_shipment_input_handled_safely(self):
        """Test that querying a non-existent route returns status not_found gracefully."""
        result = self.service.generate_quotation(
            origin="Atlantis",
            destination="Nowhere",
            cargo_type="General Cargo",
            containers=10
        )

        self.assertEqual(result["status"], "not_found")
        self.assertIn("message", result)
        self.assertIn("No shipping route found", result["message"])

    def test_missing_weather_data_does_not_crash_quotation(self):
        """Test that a route without weather data in weather.csv still generates quote safely."""
        # weather.csv now covers R001-R900 (all real routes).
        # This test verifies the safe fallback path using a mock weather agent
        # that always returns not_found, ensuring no crash occurs.
        from unittest.mock import MagicMock
        from app.services.risk_service import ShipmentRiskService
        from app.services.customs_validation_workflow import CustomsValidationWorkflow

        mock_weather = MagicMock()
        mock_weather.assess_weather.return_value = {
            "status": "not_found",
            "message": "No weather data found for route 9999"
        }
        svc_with_missing_weather = __import__(
            "app.services.quotation_service", fromlist=["QuotationService"]
        ).QuotationService(
            risk_service=ShipmentRiskService(weather_agent=mock_weather)
        )

        result = svc_with_missing_weather.generate_quotation(
            origin="Chennai",
            destination="Shanghai",
            cargo_type="General Cargo",
            containers=15
        )

        self.assertEqual(result["status"], "success")
        self.assertIn("weather_risk", result)
        self.assertEqual(result["weather_risk"]["status"], "not_available")
        self.assertIn("customs_risk", result)
        self.assertIn("overall_risk_level", result)
        self.assertIn("customer_price_usd", result)

    def test_quotation_with_declared_documents(self):
        """Test that optional declared_documents properly updates customs risk in quotation."""
        result = self.service.generate_quotation(
            origin="Chennai",
            destination="Shanghai",
            cargo_type="General Cargo",
            containers=15,
            declared_documents=["Commercial Invoice"]
        )

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["customs_risk"]["validation_status"], "DOCUMENTATION_REQUIRED")
        self.assertEqual(result["customs_risk"]["customs_risk_level"], "HIGH")
        self.assertEqual(result["overall_risk_level"], "HIGH")
        self.assertIn("Packing List", result["customs_risk"]["missing_documents"])


if __name__ == "__main__":
    unittest.main()
