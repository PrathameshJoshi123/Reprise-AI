from pydantic import BaseModel

class PhoneDetails(BaseModel):
    brand: str
    model: str
    ram_gb: int
    storage_gb: int
    screen_condition: str  # e.g., "good", "cracked"
    device_turns_on: bool
    has_original_box: bool
    has_original_bill: bool

class PricePredictionRequest(BaseModel):
    phone_details: PhoneDetails
    base_price: float  # Base price in INR

class PricePredictionResponse(BaseModel):
    predicted_price: float  # Predicted price in INR
    reasoning: str  # LLM's reasoning for the prediction
