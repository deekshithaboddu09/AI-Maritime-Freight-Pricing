from app.agents.pricing_agent import PricingAgent
from app.agents.margin_agent import MarginAgent


class FreightPricingEngine:

    def __init__(self):
        self.pricing_agent = PricingAgent()
        self.margin_agent = MarginAgent()

    def calculate_freight_price(
        self,
        route_id,
        base_freight
    ):
        pricing_result = self.pricing_agent.calculate_pricing(
            route_id=route_id,
            base_freight=base_freight
        )

        if pricing_result["status"] != "success":
            return pricing_result

        margin_result = self.margin_agent.calculate_margin(
            operating_cost=pricing_result[
                "demand_adjusted_cost_usd"
            ],
            target_margin_percent=pricing_result[
                "target_margin_percent"
            ]
        )

        if margin_result["status"] != "success":
            return margin_result

        optimization_result = self.margin_agent.optimize_margin(
            operating_cost=pricing_result[
                "demand_adjusted_cost_usd"
            ],
            minimum_margin_percent=10,
            maximum_margin_percent=20,
            step=5
        )

        if optimization_result["status"] != "success":
            return optimization_result

        return {
            "status": "success",
            "route_id": route_id,

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

            "target_margin_percent": margin_result[
                "target_margin_percent"
            ],

            "customer_price_usd": margin_result[
                "customer_price_usd"
            ],

            "profit_usd": margin_result[
                "profit_usd"
            ],

            "actual_margin_percent": margin_result[
                "actual_margin_percent"
            ],

            "recommended_margin": optimization_result[
                "recommended_margin"
            ],

            "margin_options": optimization_result[
                "margin_options"
            ]
        }