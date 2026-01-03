from fastapi import FastAPI, File, UploadFile, Form
from services.detection_service import detect_and_save
import os
import uvicorn
import shutil
import logging
from services.agentic_workflow import process_images_and_generate_report

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = FastAPI()

@app.post("/predict")
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
    logging.info(f"Received predict request for file: {file.filename}, brand: {brand}, model: {model}")
    
    # Save the uploaded file temporarily
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())
    logging.debug(f"Saved temp file: {temp_path}")
    
    # Save the original image to data folder
    data_folder = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_folder, exist_ok=True)
    original_path = os.path.join(data_folder, f"original_{file.filename}")
    shutil.copy(temp_path, original_path)
    logging.debug(f"Saved original image: {original_path}")
    
    # Process the image and save result
    result_path = detect_and_save(temp_path, f"predicted_{file.filename}")
    logging.info(f"Processed image, result path: {result_path}")
    
    # Generate report, thread_id, and final_price using the modular workflow
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
        "valid_bill": valid_bill
    }
    report, thread_id, final_price = process_images_and_generate_report(data_folder, phone_details)
    logging.info(f"Generated report and final price for thread_id: {thread_id}")
    
    # Clean up temp file
    os.remove(temp_path)
    logging.debug(f"Cleaned up temp file: {temp_path}")
    
    return {
        "result_path": result_path,
        "report": report,
        "thread_id": thread_id,
        "final_price": final_price
    }

@app.get("/")
def health():
    return {"status": "ok"}


def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000)

if __name__ == "__main__":
    run_server()
