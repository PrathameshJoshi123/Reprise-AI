from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Device Resale Admin API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Device Resale Admin API is running", "status": "ok"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Mock stats endpoint for testing
@app.get("/admin/stats")
async def get_stats():
    return {
        "active_pickups": 12,
        "total_devices": 847,
        "total_payouts": 320000.0,
        "ai_accuracy": 94.2
    }

# Mock jobs endpoint
@app.get("/jobs/")
async def get_jobs():
    return [
        {
            "id": 1,
            "customer_name": "Rahul Sharma",
            "device_model": "iPhone 13 Pro",
            "agent_name": "Agent A",
            "status": "inspecting",
            "final_price": 42000,
            "created_at": "2026-01-07T09:30:00"
        }
    ]

# Mock agent locations endpoint
@app.get("/agents/locations")
async def get_agent_locations():
    return [
        {"id": 1, "name": "Agent A", "latitude": 28.6139, "longitude": 77.2090, "status": "on_site"},
        {"id": 2, "name": "Agent B", "latitude": 28.7041, "longitude": 77.1025, "status": "idle"},
        {"id": 3, "name": "Agent C", "latitude": 28.5355, "longitude": 77.3910, "status": "in_transit"},
    ]

# Mock Kanban jobs endpoint
@app.get("/jobs/kanban")
async def get_kanban_jobs():
    return {
        "waiting": [
            {"id": 4, "customer": "Sneha Reddy", "device": "Dell XPS 15", "agent": "Unassigned"}
        ],
        "agent_on_way": [
            {"id": 3, "customer": "Amit Kumar", "device": "Samsung S23", "agent": "Agent C"}
        ],
        "inspecting": [
            {"id": 1, "customer": "Rahul Sharma", "device": "iPhone 13 Pro", "agent": "Agent A"}
        ],
        "completed": [
            {"id": 2, "customer": "Priya Patel", "device": "MacBook Air M1", "agent": "Agent B"}
        ]
    }

# Mock agent leaderboard endpoint
@app.get("/agents/leaderboard")
async def get_agent_leaderboard():
    return [
        {
            "id": 1,
            "name": "Rajesh Kumar",
            "email": "rajesh@devicehub.com",
            "phone": "+91 98765 43210",
            "completed_jobs": 156,
            "rating": 4.8,
            "avg_inspection_time": 28.5,
            "status": "active",
            "current_job": "Inspecting iPhone 14"
        },
        {
            "id": 2,
            "name": "Priya Sharma",
            "email": "priya@devicehub.com",
            "phone": "+91 98765 43211",
            "completed_jobs": 143,
            "rating": 4.9,
            "avg_inspection_time": 25.2,
            "status": "active",
            "current_job": "On way to pickup"
        },
        {
            "id": 3,
            "name": "Amit Patel",
            "email": "amit@devicehub.com",
            "phone": "+91 98765 43212",
            "completed_jobs": 132,
            "rating": 4.7,
            "avg_inspection_time": 31.8,
            "status": "idle",
            "current_job": None
        },
        {
            "id": 4,
            "name": "Sneha Reddy",
            "email": "sneha@devicehub.com",
            "phone": "+91 98765 43213",
            "completed_jobs": 128,
            "rating": 4.6,
            "avg_inspection_time": 29.3,
            "status": "active",
            "current_job": "Inspecting MacBook"
        },
        {
            "id": 5,
            "name": "Vikram Singh",
            "email": "vikram@devicehub.com",
            "phone": "+91 98765 43214",
            "completed_jobs": 115,
            "rating": 4.5,
            "avg_inspection_time": 33.1,
            "status": "idle",
            "current_job": None
        }
    ]

# Mock AI anomaly detection endpoint
@app.get("/ai-monitoring/anomalies")
async def get_anomalies():
    return [
        {
            "id": 1,
            "transaction_id": 101,
            "customer": "Ravi Verma",
            "device": "iPhone 14 Pro",
            "estimated_price": 65000,
            "final_price": 45000,
            "variance": -30.8,
            "reason": "Price too low compared to market",
            "status": "flagged",
            "photos": 4
        },
        {
            "id": 2,
            "transaction_id": 102,
            "customer": "Meera Shah",
            "device": "MacBook Pro M2",
            "estimated_price": 95000,
            "final_price": 110000,
            "variance": 15.8,
            "reason": "Price higher than estimate",
            "status": "approved",
            "photos": 6
        },
        {
            "id": 3,
            "transaction_id": 103,
            "customer": "Karan Singh",
            "device": "Samsung S23 Ultra",
            "estimated_price": 48000,
            "final_price": 32000,
            "variance": -33.3,
            "reason": "Significant damage detected",
            "status": "flagged",
            "photos": 5
        }
    ]

# Mock market trends endpoint
@app.get("/ai-monitoring/market-trends")
async def get_market_trends():
    return [
        {
            "device_model": "iPhone 13",
            "avg_price": 42000,
            "trend": "down",
            "price_change_percent": -5.2,
            "last_updated": "2026-01-07"
        },
        {
            "device_model": "iPhone 14",
            "avg_price": 58000,
            "trend": "stable",
            "price_change_percent": 0.8,
            "last_updated": "2026-01-07"
        },
        {
            "device_model": "Samsung S23",
            "avg_price": 45000,
            "trend": "down",
            "price_change_percent": -3.5,
            "last_updated": "2026-01-07"
        },
        {
            "device_model": "MacBook Air M1",
            "avg_price": 72000,
            "trend": "up",
            "price_change_percent": 2.3,
            "last_updated": "2026-01-07"
        }
    ]

# Mock photo review endpoint
@app.get("/ai-monitoring/photos/{transaction_id}")
async def get_transaction_photos(transaction_id: int):
    return [
        {
            "id": 1,
            "url": "https://via.placeholder.com/400x300?text=Front+View",
            "ai_detected_issues": True,
            "ai_analysis": {"cracks": True, "scratches": False, "dents": False}
        },
        {
            "id": 2,
            "url": "https://via.placeholder.com/400x300?text=Back+View",
            "ai_detected_issues": False,
            "ai_analysis": {"cracks": False, "scratches": True, "dents": False}
        },
        {
            "id": 3,
            "url": "https://via.placeholder.com/400x300?text=Screen",
            "ai_detected_issues": True,
            "ai_analysis": {"cracks": False, "scratches": True, "dents": False}
        }
    ]

# Mock inventory endpoint
@app.get("/inventory/devices")
async def get_inventory():
    return [
        {
            "id": 1,
            "brand": "Apple",
            "model": "iPhone 13 Pro",
            "imei": "356789012345678",
            "condition": "Good",
            "grade": "A",
            "price": 42000,
            "status": "available",
            "photos": ["https://via.placeholder.com/300x300?text=iPhone+13+Pro"],
            "acquired_date": "2026-01-05",
            "refurbishment": None
        },
        {
            "id": 2,
            "brand": "Apple",
            "model": "MacBook Air M1",
            "serial_number": "C02DK0ABMD6R",
            "condition": "Excellent",
            "grade": "A+",
            "price": 55000,
            "status": "available",
            "photos": ["https://via.placeholder.com/300x300?text=MacBook+Air"],
            "acquired_date": "2026-01-04",
            "refurbishment": None
        },
        {
            "id": 3,
            "brand": "Samsung",
            "model": "Galaxy S23",
            "imei": "356789012345679",
            "condition": "Fair",
            "grade": "B",
            "price": 32000,
            "status": "refurbishing",
            "photos": ["https://via.placeholder.com/300x300?text=Galaxy+S23"],
            "acquired_date": "2026-01-03",
            "refurbishment": "Screen replacement in progress"
        },
        {
            "id": 4,
            "brand": "Dell",
            "model": "XPS 15",
            "serial_number": "ABC123DEF456",
            "condition": "Good",
            "grade": "A",
            "price": 48000,
            "status": "sold",
            "photos": ["https://via.placeholder.com/300x300?text=Dell+XPS+15"],
            "acquired_date": "2026-01-02",
            "refurbishment": None
        },
        {
            "id": 5,
            "brand": "Apple",
            "model": "iPhone 12",
            "imei": "356789012345680",
            "condition": "Good",
            "grade": "A",
            "price": 28500,
            "status": "available",
            "photos": ["https://via.placeholder.com/300x300?text=iPhone+12"],
            "acquired_date": "2026-01-01",
            "refurbishment": None
        },
        {
            "id": 6,
            "brand": "Apple",
            "model": "iPad Pro 11",
            "serial_number": "DMPLW2X3N7VK",
            "condition": "Excellent",
            "grade": "A+",
            "price": 38000,
            "status": "available",
            "photos": ["https://via.placeholder.com/300x300?text=iPad+Pro"],
            "acquired_date": "2026-01-06",
            "refurbishment": None
        }
    ]

# Update device price endpoint
@app.patch("/inventory/devices/{device_id}/price")
async def update_device_price(device_id: int, price: float, reason: str = ""):
    return {
        "success": True,
        "device_id": device_id,
        "new_price": price,
        "reason": reason,
        "updated_at": "2026-01-07T10:30:00",
        "updated_by": "Admin"
    }

# Mock dealers endpoint
@app.get("/dealers/")
async def get_dealers():
    return [
        {
            "id": "DLR001",
            "name": "TechHub Electronics",
            "contact_person": "Rajesh Kumar",
            "email": "rajesh@techhub.com",
            "phone": "+91-98765-43210",
            "location": "Mumbai, Maharashtra",
            "kyc_status": "verified",
            "registration_date": "2023-08-15",
            "total_purchases": 45,
            "total_value": 1850000,
            "pending_payments": 0,
            "active_bids": 3,
            "rating": 4.8,
            "credit_limit": 500000,
            "last_purchase": "2026-01-05"
        },
        {
            "id": "DLR002",
            "name": "Mobile World Pvt Ltd",
            "contact_person": "Priya Sharma",
            "email": "priya@mobileworld.in",
            "phone": "+91-98123-45678",
            "location": "Delhi, NCR",
            "kyc_status": "verified",
            "registration_date": "2023-09-20",
            "total_purchases": 32,
            "total_value": 1420000,
            "pending_payments": 85000,
            "active_bids": 5,
            "rating": 4.6,
            "credit_limit": 400000,
            "last_purchase": "2026-01-04"
        },
        {
            "id": "DLR003",
            "name": "Digital Store",
            "contact_person": "Amit Patel",
            "email": "amit@digitalstore.com",
            "phone": "+91-99887-76655",
            "location": "Bangalore, Karnataka",
            "kyc_status": "pending",
            "registration_date": "2024-01-02",
            "total_purchases": 5,
            "total_value": 185000,
            "pending_payments": 0,
            "active_bids": 1,
            "rating": 4.2,
            "credit_limit": 100000,
            "last_purchase": "2026-01-03"
        },
        {
            "id": "DLR004",
            "name": "SmartTech Solutions",
            "contact_person": "Neha Gupta",
            "email": "neha@smarttech.in",
            "phone": "+91-97654-32109",
            "location": "Hyderabad, Telangana",
            "kyc_status": "verified",
            "registration_date": "2023-07-10",
            "total_purchases": 58,
            "total_value": 2340000,
            "pending_payments": 125000,
            "active_bids": 7,
            "rating": 4.9,
            "credit_limit": 600000,
            "last_purchase": "2026-01-06"
        },
        {
            "id": "DLR005",
            "name": "Gadget Paradise",
            "contact_person": "Vikram Singh",
            "email": "vikram@gadgetparadise.com",
            "phone": "+91-96543-21098",
            "location": "Pune, Maharashtra",
            "kyc_status": "rejected",
            "registration_date": "2023-12-20",
            "total_purchases": 0,
            "total_value": 0,
            "pending_payments": 0,
            "active_bids": 0,
            "rating": 0,
            "credit_limit": 0,
            "last_purchase": None
        },
        {
            "id": "DLR006",
            "name": "Elite Mobile Hub",
            "contact_person": "Sanjay Reddy",
            "email": "sanjay@elitemobile.in",
            "phone": "+91-95432-10987",
            "location": "Chennai, Tamil Nadu",
            "kyc_status": "verified",
            "registration_date": "2023-10-05",
            "total_purchases": 28,
            "total_value": 1150000,
            "pending_payments": 45000,
            "active_bids": 2,
            "rating": 4.5,
            "credit_limit": 350000,
            "last_purchase": "2026-01-02"
        }
    ]

# Mock reports endpoint
@app.get("/reports/analytics")
async def get_reports():
    return {
        "revenue_trend": [
            {"month": "Jul", "revenue": 1850000, "transactions": 42},
            {"month": "Aug", "revenue": 2100000, "transactions": 48},
            {"month": "Sep", "revenue": 1950000, "transactions": 45},
            {"month": "Oct", "revenue": 2400000, "transactions": 55},
            {"month": "Nov", "revenue": 2650000, "transactions": 62},
            {"month": "Dec", "revenue": 2950000, "transactions": 68},
            {"month": "Jan", "revenue": 850000, "transactions": 18}
        ],
        "device_category": [
            {"category": "Smartphones", "count": 145, "value": 4250000},
            {"category": "Laptops", "count": 68, "value": 3580000},
            {"category": "Tablets", "count": 42, "value": 1340000},
            {"category": "Smartwatches", "count": 28, "value": 420000}
        ],
        "brand_distribution": [
            {"brand": "Apple", "count": 128, "percentage": 45.2},
            {"brand": "Samsung", "count": 72, "percentage": 25.4},
            {"brand": "Dell", "count": 38, "percentage": 13.4},
            {"brand": "Lenovo", "count": 25, "percentage": 8.8},
            {"brand": "Others", "count": 20, "percentage": 7.2}
        ],
        "agent_performance": [
            {"name": "Rahul Sharma", "transactions": 156, "revenue": 2340000, "rating": 4.9},
            {"name": "Priya Mehta", "transactions": 142, "revenue": 2150000, "rating": 4.8},
            {"name": "Amit Patel", "transactions": 132, "revenue": 1980000, "rating": 4.7},
            {"name": "Sneha Reddy", "transactions": 128, "revenue": 1890000, "rating": 4.6},
            {"name": "Vikram Singh", "transactions": 115, "revenue": 1720000, "rating": 4.5}
        ],
        "grade_distribution": [
            {"grade": "A+", "count": 85, "percentage": 30},
            {"grade": "A", "count": 120, "percentage": 42},
            {"grade": "B", "count": 65, "percentage": 23},
            {"grade": "C", "count": 13, "percentage": 5}
        ],
        "summary": {
            "total_revenue": 9590000,
            "total_transactions": 283,
            "avg_transaction_value": 33887,
            "total_devices": 283,
            "active_agents": 5,
            "verified_dealers": 5,
            "growth_rate": 12.5,
            "customer_satisfaction": 4.7
        }
    }