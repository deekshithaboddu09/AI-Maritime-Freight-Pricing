from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.agents.RouteAgent import RouteAgent


app = FastAPI()


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Route Agent
route_agent = RouteAgent()


# Request Model
class RouteRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    containers: int


# Home API
@app.get("/")
def home():
    return {
        "message": "Agentic Maritime Brokerage API is running"
    }


# Analyze Route API
@app.post("/api/routes/analyze")
def analyze_route(request: RouteRequest):

    result = route_agent.analyze_route(
        request.origin,
        request.destination,
        request.cargo_type,
        request.containers
    )

    return result