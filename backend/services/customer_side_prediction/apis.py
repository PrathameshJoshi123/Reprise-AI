from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.shared.db.connections import get_db
from backend.services.customer_side_prediction.schema import PricePredictionRequest, PricePredictionResponse
from backend.services.customer_side_prediction.utils import get_mistral_chain, get_phone_price_from_db
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customer-side-prediction", tags=["Customer Side Prediction"])

@router.post("/predict-price", response_model=PricePredictionResponse)
async def predict_phone_price(request: PricePredictionRequest, db: Session = Depends(get_db)):
    try:
        # Always fetch base price from database based on phone specs
        try:
            base_price = get_phone_price_from_db(
                db,
                brand=request.phone_details.brand,
                model=request.phone_details.model,
                ram_gb=request.phone_details.ram_gb,
                storage_gb=request.phone_details.storage_gb
            )
            logger.info(
                f"Fetched base_price from DB: ₹{base_price} for {request.phone_details.brand} "
                f"{request.phone_details.model} (RAM: {request.phone_details.ram_gb}GB, "
                f"Storage: {request.phone_details.storage_gb}GB)"
            )
        except ValueError as e:
            logger.error(f"Failed to fetch phone price from database: {str(e)}")
            raise HTTPException(status_code=404, detail=f"Phone not found in database: {str(e)}")
        
        chain = get_mistral_chain()
        max_retries = 3
        attempt = 1
        
        while attempt <= max_retries:
            raw = chain.invoke({
                "brand": request.phone_details.brand,
                "model": request.phone_details.model,
                "ram_gb": request.phone_details.ram_gb or "Not specified",
                "storage_gb": request.phone_details.storage_gb or "Not specified",
                "screen_condition": request.phone_details.screen_condition,
                "device_turns_on": "Yes" if request.phone_details.device_turns_on else "No",
                "has_original_box": "Yes" if request.phone_details.has_original_box else "No",
                "has_original_bill": "Yes" if request.phone_details.has_original_bill else "No",
                "base_price": base_price
            })

            # The chain now returns parsed JSON directly
            parsed_response = raw
            logger.debug(f"LLM response (attempt {attempt}): %s", parsed_response)

            # Extract values from parsed JSON
            try:
                predicted_price = float(parsed_response["predicted_price"])
                reasoning = parsed_response["reasoning"]
                print(f"Predicted Price: {predicted_price}, Reasoning: {reasoning}")
            except (KeyError, ValueError, TypeError) as e:
                logger.error("Failed to extract values from parsed response: %s, Error: %s", parsed_response, str(e))
                raise HTTPException(status_code=500, detail="Failed to parse response from LLM")

            # Safety check: Ensure predicted price doesn't exceed base/selling price
            if predicted_price > base_price:
                logger.warning(
                    f"Attempt {attempt}: Predicted price ₹{predicted_price} exceeds base price ₹{base_price}. "
                    "Calling LLM again to fix the prediction."
                )
                
                # If max retries reached, cap the price
                if attempt >= max_retries:
                    logger.error(
                        f"Max retries ({max_retries}) reached. Predicted price still exceeds base price. "
                        "Capping to base price."
                    )
                    predicted_price = base_price
                    reasoning = f"After {max_retries} correction attempts, price was capped to base price (₹{base_price}). Original reasoning: {reasoning}"
                    break
                
                # Retry with corrective prompt
                attempt += 1
                continue
            else:
                # Price is valid, return the result
                logger.info(f"Valid prediction obtained on attempt {attempt}: ₹{predicted_price}")
                break

        return PricePredictionResponse(predicted_price=predicted_price, reasoning=reasoning)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
