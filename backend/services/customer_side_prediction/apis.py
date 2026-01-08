from fastapi import APIRouter, HTTPException
from .schema import PricePredictionRequest, PricePredictionResponse
from .utils import get_mistral_chain
import re
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

        # Normalize raw response to text
        if isinstance(raw, dict):
            # common keys if chain returns structured object
            text = raw.get("text") or raw.get("content") or str(raw)
        else:
            text = str(raw)
        logger.debug("LLM response: %s", text)

        # Try common labeled patterns first
        patterns = [
            r"Predicted Price:\s*₹?\s*([\d,]+)",
            r"Final Price:\s*₹?\s*([\d,]+)",
            r"Price:\s*₹?\s*([\d,]+)",
        ]

        predicted_price = None
        for p in patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                try:
                    predicted_price = float(m.group(1).replace(",", ""))
                    break
                except:
                    continue

        # Fallback: extract all numeric candidates and pick closest to base_price
        if predicted_price is None:
            candidates = []
            for s in re.findall(r"(\d{1,3}(?:,\d{3})+|\d+)", text):
                try:
                    v = int(s.replace(",", ""))
                    candidates.append(v)
                except:
                    continue

            if candidates:
                base = float(request.base_price or 0)
                if base > 0:
                    predicted_price = float(min(candidates, key=lambda c: abs(c - base)))
                else:
                    predicted_price = float(max(candidates))

        if predicted_price is None:
            logger.error("Failed to parse predicted price, LLM output: %s", text)
            raise HTTPException(status_code=500, detail="Failed to parse predicted price from LLM response")

        # Extract reasoning if present, else return full LLM text
        reasoning_match = re.search(r"Reasoning:\s*(.+)", text, re.IGNORECASE | re.DOTALL)
        reasoning = reasoning_match.group(1).strip() if reasoning_match else text.strip()

        return PricePredictionResponse(predicted_price=predicted_price, reasoning=reasoning)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
