
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .graph import app as pricing_agent
import csv
import os
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, Query, Header, Depends
from supabase import create_client, Client
from dotenv import load_dotenv

# Load Env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not found in environment variables.")

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Failed to initialize Supabase client: {e}")
    supabase = None

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
    
    # Group results by (Brand, Model)
    grouped = {}
    
    for p in phones_db:
        brand = p.get('brand', '').strip()
        model = p.get('model', '').strip()
        variant = p.get('variant', '').strip()
        try:
            price = float(p.get('price', 0) or 0)
        except:
            price = 0
            
        full_name = f"{brand} {model}".lower()
        
        # Check if query matches Brand+Model or just Model
        should_add = False
        if query in full_name:
            should_add = True
        
        if should_add:
            key = (brand, model)
            if key not in grouped:
                grouped[key] = {
                    "brand": brand,
                    "model": model,
                    "max_price": 0,
                    "variants": []
                }
            
            # Update max price for the card display
            if price > grouped[key]["max_price"]:
                grouped[key]["max_price"] = price
                
            grouped[key]["variants"].append({
                "name": variant,
                "price": price
            })
            
    # Convert dict to list
    results = list(grouped.values())
            
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

class OrderRequest(BaseModel):
    address: str
    city: str
    state: str
    pincode: str
    latitude: float
    longitude: float
    phone: Dict
    pickupDate: str
    timeSlot: str
    paymentMethod: str


@app.get("/")
def home():
    return {"message": "RePrice AI API is Running"}

@app.post("/calculate-price")
async def calculate_price(request: PricingRequest):
    """
    Endpoint that takes user inputs, runs the LangGraph Agent, 
    and returns the final calculated price.
    """
    # 1. Look up the base price directly
    base_price = None
    
    # Helper to normalize strings for comparison: remove spaces, lowercase, remove dashes
    def normalize(s):
        if not s: return ""
        return s.lower().replace(" ", "").replace("-", "").replace("_", "")

    norm_input = normalize(request.model_name)
    
    # Try exact matches with robust normalization
    for p in phones_db:
        brand = p.get('brand', '')
        model = p.get('model', '')
        variant = p.get('variant', '')
        price = float(p.get('price', 0) or 0)
        
        norm_brand = normalize(brand)
        norm_model = normalize(model)
        norm_variant = normalize(variant)
        
        # Option A: Full string "BrandModelVariant" (e.g. from Search Result)
        if norm_input == (norm_brand + norm_model + norm_variant):
            base_price = price
            break
            
        # Option B: "BrandModel"
        if norm_input == (norm_brand + norm_model):
            base_price = price
            break
            
        # Option C: "Model" (e.g. from Popular Phones list "iPhone 13")
        if norm_input == norm_model:
            base_price = price
            break

    # If still not found, try contain check but strictly on model to avoid "Pro" matching "Non-Pro"
    # Only if input is longer than model (implies input has variant info we missed)
    if base_price is None:
        for p in phones_db:
            model = p.get('model', '')
            norm_model = normalize(model)
            
            # If the database model is inside the input (e.g. Input: "iPhone 13 128GB", DB: "iPhone 13")
            # And input starts with brand or model to be safe?
            # Let's simple try: matches simple containment but verify length reasonable
            if norm_model and norm_model in norm_input:
                 price = float(p.get('price', 0) or 0)
                 base_price = price
                 # Don't break immediately, look for best match? 
                 # No, break is safer to avoid random irrelevant matches
                 break

    # 2. Prepare Input for LangGraph
    inputs = {
        "model_name": request.model_name,
        "turns_on": request.turns_on,
        "screen_condition": request.screen_condition,
        "has_box": request.has_box,
        "has_bill": request.has_bill,
        "is_under_warranty": request.is_under_warranty,
        "base_price": base_price, # Pass the found price
        "log": [] 
    }
    
    # 3. Run the Agent
    try:
        # invoke() runs the graph from start to finish
        result = pricing_agent.invoke(inputs)
        
        # 4. Return the results
        return {
            "final_price": result.get("final_price"),
            "base_price": result.get("base_price"),
            "logs": result.get("log")
        }
        
    except Exception as e:
        # If anything breaks, return a 500 error with the message
        # raise HTTPException(status_code=500, detail=str(e))
        # Return 0 price instead of crashing if agent fails
        print(f"Error: {e}")
        return {
            "final_price": 0.0,
            "base_price": base_price or 0.0,
            "logs": ["Error calculating price"]
        }

@app.post("/orders/create")
async def create_order(request: OrderRequest, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Token")
    
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase Not Configured")

    token = authorization.replace("Bearer ", "")
    
    # Verify user
    try:
        user = supabase.auth.get_user(token)
        if not user:
             raise HTTPException(status_code=401, detail="Invalid Token")
        user_id = user.user.id
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid Token")

    order_data = {
        "user_id": user_id,
        "address": request.address,
        "city": request.city,
        "state": request.state,
        "pincode": request.pincode,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "pickup_date": request.pickupDate,
        "time_slot": request.timeSlot,
        "phone_name": request.phone.get("name"),
        "phone_variant": request.phone.get("variant"),
        "phone_condition": request.phone.get("condition"),
        "price": request.phone.get("price"),
        "payment_method": request.paymentMethod,
        "status": "pending"
    }

    try:
        # Insert using the server client
        res = supabase.table("orders").insert(order_data).execute()
        return {"success": True, "order": res.data}
    except Exception as e:
        print(f"Order error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Command to run (run this in your terminal):
# uvicorn backend.main:app --reload