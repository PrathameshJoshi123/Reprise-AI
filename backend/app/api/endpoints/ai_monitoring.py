from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.photo import Photo
from app.models.transaction import Transaction
from app.schemas.ai_monitoring import PhotoReview, PriceOverride, MarketTrend

router = APIRouter(prefix="/ai-monitoring", tags=["AI Monitoring"])

@router.get("/photos/{transaction_id}", response_model=List[PhotoReview])
async def get_transaction_photos(transaction_id: int, db: Session = Depends(get_db)):
    """
    Get all photos for a transaction with AI analysis
    """
    photos = db.query(Photo).filter(Photo.transaction_id == transaction_id).all()
    
    return [
        PhotoReview(
            id=photo.id,
            url=photo.image_url,
            ai_detected_issues=photo.ai_detected_issues,
            ai_analysis=photo.ai_analysis
        )
        for photo in photos
    ]

@router.post("/price-override/{transaction_id}")
async def override_price(
    transaction_id: int,
    override_data: PriceOverride,
    db: Session = Depends(get_db)
):
    """
    Admin manually overrides the AI suggested price
    """
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.final_price = override_data.new_price
    db.commit()
    
    return {"message": "Price overridden successfully", "new_price": override_data.new_price}

@router.get("/market-trends", response_model=List[MarketTrend])
async def get_market_trends(db: Session = Depends(get_db)):
    """
    Get current market trends for popular devices
    """
    # This would call your market scraping service
    from app.services.market_service import get_trending_prices
    
    trends = await get_trending_prices()
    return trends