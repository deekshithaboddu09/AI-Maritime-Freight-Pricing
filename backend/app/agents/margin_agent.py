class MarginAgent:

    def calculate_margin(
        self,
        operating_cost,
        target_margin_percent
    ):
        if operating_cost <= 0:
            return {
                "status": "error",
                "message": "Operating cost must be greater than zero."
            }

        if target_margin_percent < 0 or target_margin_percent >= 100:
            return {
                "status": "error",
                "message": "Target margin must be between 0 and 99 percent."
            }

        target_margin = target_margin_percent / 100

        customer_price = operating_cost / (1 - target_margin)

        profit = customer_price - operating_cost

        actual_margin = (
            profit / customer_price
        ) * 100

        return {
            "status": "success",
            "operating_cost_usd": round(
                operating_cost,
                2
            ),
            "target_margin_percent": round(
                target_margin_percent,
                2
            ),
            "customer_price_usd": round(
                customer_price,
                2
            ),
            "profit_usd": round(
                profit,
                2
            ),
            "actual_margin_percent": round(
                actual_margin,
                2
            )
        }

    def optimize_margin(
        self,
        operating_cost,
        minimum_margin_percent=10,
        maximum_margin_percent=20,
        step=5
    ):
        if operating_cost <= 0:
            return {
                "status": "error",
                "message": "Operating cost must be greater than zero."
            }

        if (
            minimum_margin_percent < 0
            or maximum_margin_percent >= 100
            or minimum_margin_percent > maximum_margin_percent
            or step <= 0
        ):
            return {
                "status": "error",
                "message": "Invalid margin optimization range."
            }

        options = []

        margin = minimum_margin_percent

        while margin <= maximum_margin_percent:

            result = self.calculate_margin(
                operating_cost=operating_cost,
                target_margin_percent=margin
            )

            if result["status"] == "success":
                options.append(result)

            margin += step

        best_option = options[-1]

        return {
            "status": "success",
            "operating_cost_usd": round(
                operating_cost,
                2
            ),
            "recommended_margin": best_option,
            "margin_options": options
        }