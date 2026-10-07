from typing import List, Optional
from pydantic import BaseModel


class RouteRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    containers: int


class QuotationRequest(BaseModel):
    origin: str
    destination: str
    cargo_type: str
    containers: int
    declared_documents: Optional[List[str]] = None