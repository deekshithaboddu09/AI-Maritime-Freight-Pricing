import math
from pathlib import Path

import pandas as pd


class RouteAgent:

    # Port coordinates used for approximate
    # geographical distance calculation.
    PORT_COORDINATES = {

        "antwerp": (51.2213, 4.4051),

        "busan": (35.1796, 129.0756),

        "chennai": (13.0827, 80.2707),

        "colombo": (6.9271, 79.8612),

        "dubai": (25.2048, 55.2708),

        "durban": (-29.8587, 31.0218),

        "hamburg": (53.5511, 9.9937),

        "hong kong": (22.3193, 114.1694),

        "jebel ali": (25.0119, 55.0613),

        "kolkata": (22.5726, 88.3639),

        "los angeles": (33.7405, -118.2775),

        "mumbai": (19.0760, 72.8777),

        "new york": (40.7128, -74.0060),

        "rotterdam": (51.9244, 4.4777),

        "santos": (-23.9608, -46.3336),

        "shanghai": (31.2304, 121.4737),

        "singapore": (1.3521, 103.8198),

        "sydney": (-33.8688, 151.2093),

        "tokyo": (35.6762, 139.6503),

        "valencia": (39.4699, -0.3763),

    }


    def __init__(self):

        # Get backend directory
        backend_dir = (
            Path(__file__).resolve().parent.parent
        )

        # Dataset path
        file_path = (
            backend_dir
            / "data"
            / "routes.csv"
        )

        # Load CSV
        self.data = pd.read_csv(file_path)

        print(
            "Routes data loaded successfully"
        )

        print(
            "Total routes:",
            len(self.data)
        )


    # =====================================================
    # DISTANCE CALCULATION
    # =====================================================

    def calculate_distance_nm(
        self,
        origin,
        destination
    ):

        origin_key = (
            str(origin)
            .strip()
            .lower()
        )

        destination_key = (
            str(destination)
            .strip()
            .lower()
        )

        origin_coordinates = (
            self.PORT_COORDINATES.get(
                origin_key
            )
        )

        destination_coordinates = (
            self.PORT_COORDINATES.get(
                destination_key
            )
        )

        # Coordinates not available
        if (
            origin_coordinates is None
            or destination_coordinates is None
        ):
            return None

        lat1, lon1 = origin_coordinates
        lat2, lon2 = destination_coordinates

        earth_radius_km = 6371.0

        lat1 = math.radians(lat1)
        lat2 = math.radians(lat2)

        delta_lat = math.radians(
            lat2 - lat1
        )

        delta_lon = math.radians(
            lon2 - lon1
        )

        # Haversine formula
        a = (
            math.sin(delta_lat / 2) ** 2
            +
            math.cos(lat1)
            * math.cos(lat2)
            * math.sin(delta_lon / 2) ** 2
        )

        c = 2 * math.atan2(
            math.sqrt(a),
            math.sqrt(1 - a)
        )

        distance_km = (
            earth_radius_km * c
        )

        # 1 nautical mile = 1.852 km
        distance_nm = (
            distance_km / 1.852
        )

        return round(
            distance_nm,
            1
        )


    # =====================================================
    # TRANSIT TIME
    # =====================================================

    def calculate_transit_days(
        self,
        distance_nm,
        speed
    ):

        if (
            distance_nm is None
            or speed is None
        ):
            return None

        speed = float(speed)

        if speed <= 0:
            return None

        # Knot = nautical mile per hour
        hours = distance_nm / speed

        days = hours / 24

        return round(
            days,
            1
        )


    # =====================================================
    # CREATE ROUTE INFORMATION
    # =====================================================

    def enrich_route(
        self,
        route,
        cargo_type_clean,
        requested_containers
    ):

        route_cargo = (
            str(route["cargo_type"])
            .strip()
            .lower()
        )

        cargo_match = (
            route_cargo
            == cargo_type_clean
        )

        container_difference = abs(
            int(route["containers"])
            - requested_containers
        )

        distance_nm = (
            self.calculate_distance_nm(
                route["origin"],
                route["destination"]
            )
        )

        estimated_days = (
            self.calculate_transit_days(
                distance_nm,
                route["speed"]
            )
        )

        return {

            "route_id": int(
                route["route_id"]
            ),

            "origin": str(
                route["origin"]
            ),

            "destination": str(
                route["destination"]
            ),

            "cargo_type": str(
                route["cargo_type"]
            ),

            "containers": int(
                route["containers"]
            ),

            "recommended_ship": str(
                route["recommended_ship"]
            ),

            "imo_number": str(
                route["imo_number"]
            ),

            "speed": float(
                route["speed"]
            ),

            "latitude": float(
                route["latitude"]
            ),

            "longitude": float(
                route["longitude"]
            ),

            "departure_port": str(
                route["departure_port"]
            ),

            "arrival_port": str(
                route["arrival_port"]
            ),

            "origin_country": str(
                route["origin_country"]
            ),

            "destination_country": str(
                route["destination_country"]
            ),

            "cargo_match": cargo_match,

            "container_difference":
                container_difference,

            "distance_nm":
                distance_nm,

            "estimated_days":
                estimated_days,

        }


    # =====================================================
    # ROUTE ANALYSIS
    # =====================================================

    def analyze_route(
        self,
        origin,
        destination,
        cargo_type,
        containers
    ):

        # Clean input
        origin_clean = (
            origin
            .strip()
            .lower()
        )

        destination_clean = (
            destination
            .strip()
            .lower()
        )

        cargo_type_clean = (
            cargo_type
            .strip()
            .lower()
        )

        requested_containers = int(
            containers
        )

        print("\n==============================")
        print("ROUTE SEARCH")
        print("==============================")

        print(
            "Origin:",
            origin_clean
        )

        print(
            "Destination:",
            destination_clean
        )

        print(
            "Cargo:",
            cargo_type_clean
        )

        print(
            "Containers:",
            requested_containers
        )


        # =================================================
        # STEP 1
        # FIND ALL ROUTES BETWEEN ORIGIN + DESTINATION
        # =================================================

        route_candidates = self.data[
            (
                self.data["origin"]
                .astype(str)
                .str.strip()
                .str.lower()
                == origin_clean
            )
            &
            (
                self.data["destination"]
                .astype(str)
                .str.strip()
                .str.lower()
                == destination_clean
            )
        ].copy()


        # =================================================
        # STEP 2
        # NO ROUTE
        # =================================================

        if route_candidates.empty:

            return {

                "status": "not_found",

                "message": (
                    f"No shipping route found between "
                    f"{origin.title()} and "
                    f"{destination.title()}"
                ),

                "origin":
                    origin.title(),

                "destination":
                    destination.title(),

                "cargo_type":
                    cargo_type.title(),

                "containers":
                    requested_containers,

                "total_routes_found":
                    0,

                "all_routes":
                    []

            }


        # =================================================
        # STEP 3
        # ENRICH ALL ROUTES
        # =================================================

        all_routes = []

        for _, route in route_candidates.iterrows():

            enriched_route = (
                self.enrich_route(
                    route,
                    cargo_type_clean,
                    requested_containers
                )
            )

            all_routes.append(
                enriched_route
            )


        # =================================================
        # STEP 4
        # CHECK EXACT CARGO MATCHES
        # =================================================

        exact_cargo_routes = [

            route
            for route in all_routes
            if route["cargo_match"]
        ]


        # =================================================
        # STEP 5
        # CHOOSE COMPETING ROUTES
        #
        # If exact cargo routes exist,
        # only those compete for BEST ROUTE.
        #
        # Otherwise all available routes
        # are considered as fallback options.
        # =================================================

        if exact_cargo_routes:

            competing_routes = (
                exact_cargo_routes
            )

            cargo_priority_message = (
                "Exact cargo matches were given "
                "priority over other route options."
            )

        else:

            competing_routes = (
                all_routes
            )

            cargo_priority_message = (
                "No exact cargo match was available, "
                "so the closest available route options "
                "were compared."
            )


        # =================================================
        # STEP 6
        # SORT BEST ROUTE
        #
        # Priority:
        # 1. Exact cargo match
        # 2. Smallest container difference
        # 3. Shortest transit time
        # 4. Shortest distance
        # =================================================

        competing_routes.sort(
            key=lambda route: (

                0
                if route["cargo_match"]
                else 1,

                route["container_difference"],

                route["estimated_days"]
                if route["estimated_days"]
                is not None
                else float("inf"),

                route["distance_nm"]
                if route["distance_nm"]
                is not None
                else float("inf"),

            )
        )


        # =================================================
        # STEP 7
        # BEST ROUTE
        # =================================================

        best_route = (
            competing_routes[0]
        )


        # =================================================
        # STEP 8
        # SORT ALL DISPLAY ROUTES
        #
        # Exact cargo routes first.
        # Then container difference.
        # Then transit time.
        # =================================================

        all_routes.sort(
            key=lambda route: (

                0
                if route["cargo_match"]
                else 1,

                route["container_difference"],

                route["estimated_days"]
                if route["estimated_days"]
                is not None
                else float("inf"),

            )
        )


        # =================================================
        # STEP 9
        # CALCULATE MATCH SCORE
        # =================================================

        best_container_difference = (
            best_route["container_difference"]
        )

        cargo_score = (
            70
            if best_route["cargo_match"]
            else 0
        )

        container_score = max(
            0,
            30
            - best_container_difference
        )

        match_percentage = (
            cargo_score
            + container_score
        )


        # =================================================
        # STEP 10
        # RECOMMENDATION REASON
        # =================================================

        if (
            best_route["cargo_match"]
            and best_container_difference == 0
        ):

            recommendation_reason = (

                "This route is recommended because "
                "the cargo type and container requirement "
                "exactly match your shipment. "
                "Transit time was also considered when "
                "comparing matching options."

            )

        elif best_route["cargo_match"]:

            recommendation_reason = (

                "This route is recommended because "
                "the cargo type exactly matches your "
                "shipment and it has the closest "
                "container requirement among the "
                "matching cargo options."

            )

        else:

            recommendation_reason = (

                "No exact cargo match was available. "
                "The system selected the closest "
                "available route based on container "
                "requirement and transit time."

            )


        # =================================================
        # STEP 11
        # ADD RANK
        # =================================================

        for index, route in enumerate(
            all_routes
        ):

            route["rank"] = (
                index + 1
            )

            route["is_best"] = (
                route["route_id"]
                == best_route["route_id"]
            )


        # =================================================
        # STEP 12
        # RETURN RESULT
        # =================================================

        return {

            "status":
                "found",

            "message": (
                f"{len(all_routes)} routes found "
                f"between "
                f"{best_route['origin']} and "
                f"{best_route['destination']}"
            ),

            "origin":
                origin.title(),

            "destination":
                destination.title(),

            "cargo_type":
                cargo_type.title(),

            "containers":
                requested_containers,

            "total_routes_found":
                len(all_routes),


            # =================================================
            # AI RECOMMENDATION
            # =================================================

            "recommendation": {

                "match_percentage":
                    match_percentage,

                "cargo_match": (

                    "Exact Match"
                    if best_route["cargo_match"]
                    else
                    "Closest Available Match"

                ),

                "container_difference": (

                    f"{best_container_difference} "
                    f"containers"

                ),

                "recommendation_reason":
                    recommendation_reason,

                "selection_logic":
                    cargo_priority_message,

                "distance_nm":
                    best_route[
                        "distance_nm"
                    ],

                "estimated_days":
                    best_route[
                        "estimated_days"
                    ]

            },


            # =================================================
            # BEST ROUTE
            # =================================================

            "route_info":
                best_route,


            # =================================================
            # ALL AVAILABLE ROUTES
            # =================================================

            "all_routes":
                all_routes

        }