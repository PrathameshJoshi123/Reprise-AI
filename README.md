# RepriseAI AgentPricing

A FastAPI-based backend service for AI-powered phone detection, analysis, and pricing. It processes uploaded images to detect phone features, generates reports, and calculates final prices using an agentic workflow with Mistral AI integration.

## Features

- Image upload and object detection using computer vision models.
- Phone detail analysis (brand, model, storage, etc.).
- Report generation and pricing via AI workflows.
- RESTful API endpoints for prediction and health checks.

## Prerequisites

- Python 3.8+
- Virtual environment (recommended)

## Installation

1. Clone the repository and navigate to the backend directory.
2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Setup

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Edit `.env` and add your Mistral API key:
   ```
   MISTRAL_API_KEY=your_actual_mistral_api_key_here
   ```

## Running the Server

Run the application:

```
python main.py
```

The server will start on `http://127.0.0.1:8000`.

## API Endpoints

- `GET /`: Health check endpoint. Returns `{"status": "ok"}`.
- `POST /predict`: Upload an image and provide phone details to get detection results, report, thread ID, and final price.
  - Parameters:
    - `file`: Image file (UploadFile).
    - `brand`, `series`, `model`, `storage_raw`, `ram_gb`, `internal_storage_gb`, `display_issues`, `biometrics_working`, `camera_working`, `buttons_working`, `sound_working`: Phone details (Form).
    - `original_charger`, `original_box`, `valid_bill`: Boolean flags (Form).
  - Response: JSON with `result_path`, `report`, `thread_id`, and `final_price`.

## Project Structure

- `main.py`: FastAPI app with endpoints.
- `services/detection_service.py`: Image detection logic.
- `services/agentic_workflow.py`: Workflow for report and pricing generation.
- `data/`: Folder for storing processed images.
- `requirements.txt`: Python dependencies.
- `.env.example`: Environment variables template.

## Dependencies

Key libraries include FastAPI, Uvicorn, LangChain, Ultralytics, and more (see `requirements.txt`).

## Contributing

Ensure to follow best practices for AI and data privacy. Test changes locally before committing.

## License

[Add license information if applicable]
