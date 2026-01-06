from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .graph import app as pricing_agent
import csv
import os
from typing import List, Dict

# Initialize FastAPI
app = FastAPI(title="RePrice AI API")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
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

@app.get("/search-phones")
def search_phones(q: str = Query(..., min_length=1)):
    query = q.lower()
    results = []
    seen = set()
    
    for p in phones_db:
        # Create a unique key to avoid duplicates if any (or just to group variants?)
        # For now, let's return individual entries as they have variants
        # But frontend might expect unique models.
        # The CSV has brand, model, variant, price.
        # Let's search in brand and model.
        brand = p.get('brand', '').strip()
        model = p.get('model', '').strip()
        full_name = f"{brand} {model}".lower()
        
        if query in full_name:
            results.append({
                "brand": brand,
                "model": model,
                "variant": p.get('variant', ''),
                "price": float(p.get('price', 0) or 0)
            })
            
    # Limit results
    return results[:50]

# Define the Input Schema (Data validation)
class PricingRequest(BaseModel):
    model_name: str
    turns_on: bool
    screen_condition: str  # Accepts "Good", "Minor Scratches", "Shattered", etc.
    has_box: bool
    # --- NEW FIELDS ---
    has_bill: bool
    is_under_warranty: bool

@app.get("/")
def home():
    return {"message": "RePrice AI API is Running"}

@app.post("/calculate-price")
async def calculate_price(request: PricingRequest):
    """
    Endpoint that takes user inputs, runs the LangGraph Agent, 
    and returns the final calculated price.
    """
    # 1. Prepare Input for LangGraph
    # We map the API request data to the 'PricingState' dictionary
    inputs = {
        "model_name": request.model_name,
        "turns_on": request.turns_on,
        "screen_condition": request.screen_condition,
        "has_box": request.has_box,
        "has_bill": request.has_bill,            # <--- Added
        "is_under_warranty": request.is_under_warranty, # <--- Added
        "log": [] 
    }
    
    # 2. Run the Agent
    try:
        # invoke() runs the graph from start to finish
        result = pricing_agent.invoke(inputs)
        
        # 3. Return the results
        return {
            "final_price": result.get("final_price"),
            "base_price": result.get("base_price"),
            "logs": result.get("log")
        }
        
    except Exception as e:
        # If anything breaks, return a 500 error with the message
        raise HTTPException(status_code=500, detail=str(e))

# Command to run (run this in your terminal):
# uvicorn backend.main:app --reload