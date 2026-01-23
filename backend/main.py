import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.auth.apis import router as auth_router
from services.sell_phone.apis.routes import router as sell_phone_router
from services.customer_side_prediction.apis import router as customer_side_prediction_router
from services.admin.apis.routes import router as admin_router
from services.partner.apis.routes import router as partner_router
from services.partner.apis.agent_routes import router as agent_router
# from services.mobile_price_prediction.detection_api import router as detection_router
from shared.db.connections import Base, engine
from starlette.middleware.sessions import SessionMiddleware
from config import FRONTEND_URL


import asyncio
from dotenv import load_dotenv

load_dotenv()

# ensure selector event loop on Windows
if os.name == "nt":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

app = FastAPI(title="RepriseAI Backend", version="1.0.0")
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET_KEY", "supersecretkey"))
# Configure CORS

frontend_origins = [
    FRONTEND_URL if FRONTEND_URL else os.getenv("FRONTEND_URL", "http://localhost:5173")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables (models' Base.metadata.create_all also called in services, safe to call again)
Base.metadata.create_all(bind=engine)

# Register service routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(sell_phone_router)
app.include_router(customer_side_prediction_router)
app.include_router(admin_router)
app.include_router(partner_router)
app.include_router(agent_router)
# app.include_router(detection_router)

# Register service routes here (e.g., from services.valuation.apis import router; app.include_router(router))
# Example: app.include_router(valuation_router, prefix="/valuation")

@app.get("/")
def read_root():
    return {"message": "RepriseAI Backend API"}

if __name__ == "__main__":
    import uvicorn
    # prefer running `uvicorn main:app --reload` in dev; this runs without reload
    uvicorn.run(app, host="0.0.0.0", port=8000)
