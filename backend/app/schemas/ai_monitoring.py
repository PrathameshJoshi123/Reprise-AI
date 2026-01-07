from pydantic import BaseModel
from typing import Optional, Dict, List

class PhotoReview(BaseModel):
    id: int
    url: str
    ai_detected_issues: bool
    ai_analysis: Optional[Dict] = None
    
    class Config:
        from_attributes = True


class PriceOverride(BaseModel):
    new_price: float
    reason: Optional[str] = None


class MarketTrend(BaseModel):
    device_model: str
    avg_price: float
    trend: str  # "up", "down", "stable"
    price_change_percent: float
