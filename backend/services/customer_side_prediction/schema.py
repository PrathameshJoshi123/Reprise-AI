from pydantic import BaseModel
from typing import Optional

class PhoneDetails(BaseModel):
    brand: str
    model: str
    ram_gb: Optional[int] = None
    storage_gb: Optional[int] = None
    screen_condition: str  # e.g., "good", "cracked"
    device_turns_on: bool
    has_original_box: bool
    has_original_bill: bool

class PricePredictionRequest(BaseModel):
    phone_details: PhoneDetails
    # base_price is always fetched from DB based on brand, model, ram_gb, storage_gb

class PricePredictionResponse(BaseModel):
    predicted_price: float  # Predicted price in INR
    reasoning: str  # LLM's reasoning for the prediction
