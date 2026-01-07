from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class JobResponse(BaseModel):
    id: int
    customer_name: str
    device_model: str
    agent_name: str
    status: str
    final_price: Optional[float]
    created_at: datetime
    photos: Optional[List[str]] = []
    diagnostic_score: Optional[float] = None
    
    class Config:
        from_attributes = True