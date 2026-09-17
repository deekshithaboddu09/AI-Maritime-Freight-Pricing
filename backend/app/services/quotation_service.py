from app.agents.RouteAgent import RouteAgent
from app.services.freight_pricing_engine import FreightPricingEngine


class QuotationService:

    def __init__(self):
        self.route_agent = RouteAgent()
        self.pricing_engine = FreightPricingEngine()

    def generate_quotation(
        self,
        origin,
        destination,
        cargo_type,
        containers
    ):
        route_result = self.route_agent.analyze_route(
            origin=origin,
            destination=destination,
            cargo_type=cargo_type,
            containers=containers
        )

        if route_result["status"] != "found":
            return route_result

        best_route = route_result["route_info"]

        freight_per_nm = 0.50
        distance_nm = best_route["distance_nm"]

        if distance_nm is None:
            base_freight = 0
        else:
            base_freight = round(
                distance_nm * freight_per_nm,
                2
            )

        pricing_result = self.pricing_engine.calculate_freight_price(
            route_id=best_route["route_id"],
            base_freight=base_freight
        )

        if pricing_result["status"] != "success":
            return pricing_result

        alternatives = [
            route
            for route in route_result["all_routes"]
            if route["route_id"] != best_route["route_id"]
        ]

        return {
            "status": "success",
            "origin": origin,
            "destination": destination,
            "cargo_type": cargo_type,
            "containers": containers,
            "recommended_route": best_route,

            "route_score": route_result[
                "recommendation"
            ]["match_percentage"],

            "transit_time_days": best_route[
                "estimated_days"
            ],

            "base_freight_usd": pricing_result[
                "base_freight_usd"
            ],

            "fuel_surcharge_usd": pricing_result[
                "fuel_surcharge_usd"
            ],

            "port_charge_usd": pricing_result[
                "port_charge_usd"
            ],

            "risk_surcharge_usd": pricing_result[
                "risk_surcharge_usd"
            ],

            "demand_factor": pricing_result[
                "demand_factor"
            ],

            "operating_cost_usd": pricing_result[
                "operating_cost_usd"
            ],

            "demand_adjusted_cost_usd": pricing_result[
                "demand_adjusted_cost_usd"
            ],

            "target_margin_percent": pricing_result[
                "target_margin_percent"
            ],

            "customer_price_usd": pricing_result[
                "customer_price_usd"
            ],

            "profit_usd": pricing_result[
                "profit_usd"
            ],

            "actual_margin_percent": pricing_result[
                "actual_margin_percent"
            ],

            "recommended_margin": pricing_result[
                "recommended_margin"
            ],

            "margin_options": pricing_result[
                "margin_options"
            ],

            "alternatives": alternatives,

            "message": "Quotation generated successfully."
        }