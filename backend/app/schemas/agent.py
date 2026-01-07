from pydantic import BaseModel
from typing import Optional

class AgentLeaderboard(BaseModel):
    id: int
    name: str
    completed_jobs: int
    rating: float
    avg_inspection_time: float
    
    class Config:
        from_attributes = True


class AgentLocation(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    status: str  # "idle", "on_site", "in_transit"
    
    class Config:
        from_attributes = True
