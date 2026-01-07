from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from app.database import get_db
from app.models.transaction import Transaction, TransactionStatus
from app.models.agent import Agent
from app.schemas.stats import DailyStats

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/stats", response_model=DailyStats)
async def get_daily_stats(db: Session = Depends(get_db)):
    """
    Get daily stats for the admin dashboard
    - Active Pickups: Agents currently inspecting
    - Total Devices: Count of all collected devices
    - Total Payouts: Sum of payments made today
    - AI Accuracy: Percentage match between estimated and final prices
    """
    # Get today's date range
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    # 1. Active Pickups: Transactions with status "inspecting"
    active_pickups = db.query(Transaction).filter(
        Transaction.status.in_([TransactionStatus.AGENT_ON_WAY, TransactionStatus.INSPECTING])
    ).count()
    
    # 2. Total Devices Collected
    total_devices = db.query(Transaction).filter(
        Transaction.status == TransactionStatus.COMPLETED
    ).count()
    
    # 3. Total Payouts Today
    total_payouts = db.query(func.sum(Transaction.final_price)).filter(
        and_(
            Transaction.status == TransactionStatus.COMPLETED,
            Transaction.completed_at >= today_start,
            Transaction.completed_at < today_end
        )
    ).scalar() or 0.0
    
    # 4. AI Accuracy: Compare estimated_price vs final_price
    completed_transactions = db.query(Transaction).filter(
        Transaction.status == TransactionStatus.COMPLETED,
        Transaction.estimated_price.isnot(None),
        Transaction.final_price.isnot(None)
    ).all()
    
    if completed_transactions:
        accuracy_scores = []
        for txn in completed_transactions:
            # Calculate percentage accuracy
            estimated = txn.estimated_price
            final = txn.final_price
            if estimated > 0:
                accuracy = 100 - abs((final - estimated) / estimated * 100)
                accuracy = max(0, min(100, accuracy))  # Clamp between 0-100
                accuracy_scores.append(accuracy)
        
        ai_accuracy = sum(accuracy_scores) / len(accuracy_scores) if accuracy_scores else 0.0
    else:
        ai_accuracy = 0.0
    
    return DailyStats(
        active_pickups=active_pickups,
        total_devices=total_devices,
        total_payouts=round(total_payouts, 2),
        ai_accuracy=round(ai_accuracy, 1)
    )