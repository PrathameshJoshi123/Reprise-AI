import os
from dotenv import load_dotenv

# ✅ MUST be first
load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
import csv

# ✅ Import graph ONLY AFTER env is loaded
from .graph import app as pricing_agent


# Initialize FastAPI
app = FastAPI(title="RePrice AI API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Phone Data from CSV
phones_db = []
try:
    csv_path = os.path.join("data", "all_phones.csv")
    if os.path.exists(csv_path):
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                phones_db.append(row)
        print(f"Loaded {len(phones_db)} phones from CSV.")
    else:
        print(f"Warning: CSV file not found at {csv_path}")
except Exception as e:
    print(f"Error loading CSV: {e}")


@app.get("/")
def home():
    return {"message": "RePrice AI API is Running"}


@app.get("/search-phones")
def search_phones(q: str = Query(..., min_length=1)):
    query = q.lower()
    results = []

    for p in phones_db:
        brand = p.get("brand", "").strip()
        model = p.get("model", "").strip()
        full_name = f"{brand} {model}".lower()

        if query in full_name:
            results.append({
                "brand": brand,
                "model": model,
                "variant": p.get("variant", ""),
                "price": float(p.get("price", 0) or 0)
            })

    return results[:50]


class PricingRequest(BaseModel):
    model_name: str
    turns_on: bool
    screen_condition: str
    has_box: bool
    has_bill: bool
    is_under_warranty: bool


@app.post("/calculate-price")
async def calculate_price(request: PricingRequest):
    inputs = {
        "model_name": request.model_name,
        "turns_on": request.turns_on,
        "screen_condition": request.screen_condition,
        "has_box": request.has_box,
        "has_bill": request.has_bill,
        "is_under_warranty": request.is_under_warranty,
        "log": []
    }

    try:
        result = pricing_agent.invoke(inputs)

        return {
            "final_price": result.get("final_price"),
            "base_price": result.get("base_price"),
            "logs": result.get("log")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
