from pydantic import BaseModel

class DailyStats(BaseModel):
    active_pickups: int
    total_devices: int
    total_payouts: float
    ai_accuracy: float