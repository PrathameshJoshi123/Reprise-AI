from fastapi import APIRouter, HTTPException
from backend.services.customer_side_prediction.schema import PricePredictionRequest, PricePredictionResponse
from backend.services.customer_side_prediction.utils import get_mistral_chain
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customer-side-prediction", tags=["Customer Side Prediction"])

@router.post("/predict-price", response_model=PricePredictionResponse)
async def predict_phone_price(request: PricePredictionRequest):
    try:
        chain = get_mistral_chain()
        raw = chain.invoke({
            "brand": request.phone_details.brand,
            "model": request.phone_details.model,
            "ram_gb": request.phone_details.ram_gb,
            "storage_gb": request.phone_details.storage_gb,
            "screen_condition": request.phone_details.screen_condition,
            "device_turns_on": "Yes" if request.phone_details.device_turns_on else "No",
            "has_original_box": "Yes" if request.phone_details.has_original_box else "No",
            "has_original_bill": "Yes" if request.phone_details.has_original_bill else "No",
            "base_price": request.base_price
        })

        # The chain now returns parsed JSON directly
        parsed_response = raw
        logger.debug("LLM response: %s", parsed_response)

        # Extract values from parsed JSON
        try:
            predicted_price = float(parsed_response["predicted_price"])
            reasoning = parsed_response["reasoning"]
        except (KeyError, ValueError, TypeError) as e:
            logger.error("Failed to extract values from parsed response: %s, Error: %s", parsed_response, str(e))
            raise HTTPException(status_code=500, detail="Failed to parse response from LLM")

        # Validate that predicted price doesn't exceed base price
        if predicted_price > request.base_price:
            logger.error("Predicted price %f exceeds base price %f", predicted_price, request.base_price)
            raise HTTPException(status_code=500, detail="Predicted price exceeds base price")

        return PricePredictionResponse(predicted_price=predicted_price, reasoning=reasoning)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
