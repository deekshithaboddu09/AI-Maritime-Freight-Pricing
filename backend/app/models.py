from pydantic import BaseModel


class RouteRequest(BaseModel):
	origin: str
	destination: str
	cargo_type: str
	containers: int
