from fastapi import APIRouter, FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from services.mobile_price_prediction.detection_service import detect_and_save
from services.mobile_price_prediction.agentic_workflow import process_images_and_generate_report
import os
import shutil
import logging

router = APIRouter()
logging.basicConfig(level=logging.INFO)


@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
    brand: str = Form(None),
    series: str = Form(None),
    model: str = Form(None),
    storage_raw: str = Form(None),
    ram_gb: float = Form(None),
    internal_storage_gb: int = Form(None),
    display_issues: str = Form(None),
    biometrics_working: str = Form(None),
    camera_working: str = Form(None),
    buttons_working: str = Form(None),
    sound_working: str = Form(None),
    original_charger: bool = Form(False),
    original_box: bool = Form(False),
    valid_bill: bool = Form(False)
):
    logging.info(f"Received predict request for file: {getattr(file,'filename',None)}, brand: {brand}, model: {model}")

    try:
        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        logging.debug(f"Saved temp file: {temp_path}")

        # Ensure shared data folder under backend/services
        data_folder = os.path.join(os.path.dirname(__file__), "data")
        os.makedirs(data_folder, exist_ok=True)

        # Copy original into data folder
        original_path = os.path.join(data_folder, f"original_{file.filename}")
        shutil.copy(temp_path, original_path)
        logging.debug(f"Saved original image: {original_path}")

        # Run detection and save annotated result in data folder
        result_path = detect_and_save(temp_path, f"predicted_{file.filename}")
        logging.info(f"Processed image, result path: {result_path}")

        # Prepare phone details and run workflow to get report and price
        phone_details = {
            "brand": brand,
            "series": series,
            "model": model,
            "storage_raw": storage_raw,
            "ram_gb": ram_gb,
            "internal_storage_gb": internal_storage_gb,
            "display_issues": display_issues,
            "biometrics_working": biometrics_working,
            "camera_working": camera_working,
            "buttons_working": buttons_working,
            "sound_working": sound_working,
            "original_charger": original_charger,
            "original_box": original_box,
            "valid_bill": valid_bill,
        }

        report, thread_id, final_price = process_images_and_generate_report(data_folder, phone_details)
        logging.info(f"Generated report and final price for thread_id: {thread_id}")

        # cleanup temp file
        try:
            os.remove(temp_path)
            logging.debug(f"Cleaned up temp file: {temp_path}")
        except Exception:
            pass

        return JSONResponse({
            "result_path": result_path,
            "report": report,
            "thread_id": thread_id,
            "final_price": final_price
        })

    except Exception as e:
        logging.exception("Error in /predict")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
def health():
    return {"status": "ok"}
