from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.agents.RouteAgent import RouteAgent
from app.agents.pricing_agent import PricingAgent
from app.models import QuotationRequest
from app.services.quotation_service import QuotationService


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


route_agent = RouteAgent()
pricing_agent = PricingAgent()
quotation_service = QuotationService()


class RouteRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    containers: int


@app.get("/")
def home():
    return {
        "message": "Agentic Maritime Brokerage API is running"
    }


@app.post("/api/routes/analyze")
def analyze_route(request: RouteRequest):

    result = route_agent.analyze_route(
        request.origin,
        request.destination,
        request.cargo_type,
        request.containers
    )

    return result


@app.post("/api/pricing/calculate")
def calculate_pricing(request: QuotationRequest):

    route_result = route_agent.analyze_route(
        request.origin,
        request.destination,
        request.cargo_type,
        request.containers
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

    pricing_result = pricing_agent.calculate_pricing(
        route_id=best_route["route_id"],
        base_freight=base_freight
    )

    return pricing_result


@app.post("/api/quotations/generate")
def generate_quotation(request: QuotationRequest):

    result = quotation_service.generate_quotation(
        origin=request.origin,
        destination=request.destination,
        cargo_type=request.cargo_type,
        containers=request.containers
    )

    return result