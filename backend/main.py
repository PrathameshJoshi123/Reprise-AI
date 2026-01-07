import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.auth.apis import router as auth_router
from shared.db.connections import Base, engine
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

# Configure CORS
FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in FRONTEND_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables (models' Base.metadata.create_all also called in services, safe to call again)
Base.metadata.create_all(bind=engine)

app.include_router(auth_router, prefix="/auth", tags=["auth"])

# Register service routes here (e.g., from services.valuation.apis import router; app.include_router(router))
# Example: app.include_router(valuation_router, prefix="/valuation")

@app.get("/")
def read_root():
    return {"message": "RepriseAI Backend API"}

if __name__ == "__main__":
    import uvicorn
    # prefer running `uvicorn main:app --reload` in dev; this runs without reload
    uvicorn.run(app, host="0.0.0.0", port=8000)
