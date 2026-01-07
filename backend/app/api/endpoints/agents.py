from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models.agent import Agent
from app.models.transaction import Transaction, TransactionStatus
from app.schemas.agent import AgentLeaderboard, AgentLocation

router = APIRouter(prefix="/agents", tags=["Agent Tracking"])

@router.get("/leaderboard", response_model=List[AgentLeaderboard])
async def get_agent_leaderboard(db: Session = Depends(get_db)):
    """
    Get agent leaderboard sorted by performance
    """
    agents = db.query(Agent).filter(Agent.is_active == True).all()
    
    leaderboard = []
    for agent in agents:
        leaderboard.append(AgentLeaderboard(
            id=agent.id,
            name=agent.name,
            completed_jobs=agent.total_jobs_completed,
            rating=agent.average_rating,
            avg_inspection_time=agent.average_inspection_time
        ))
    
    # Sort by completed jobs (descending)
    leaderboard.sort(key=lambda x: x.completed_jobs, reverse=True)
    
    return leaderboard

@router.get("/locations", response_model=List[AgentLocation])
async def get_agent_locations(db: Session = Depends(get_db)):
    """
    Get real-time locations of all active agents
    """
    agents = db.query(Agent).filter(
        Agent.is_active == True,
        Agent.current_latitude.isnot(None)
    ).all()
    
    return [
        AgentLocation(
            id=agent.id,
            name=agent.name,
            latitude=agent.current_latitude,
            longitude=agent.current_longitude,
            status="on_site" if db.query(Transaction).filter(
                Transaction.agent_id == agent.id,
                Transaction.status == TransactionStatus.INSPECTING
            ).first() else "idle"
        )
        for agent in agents
    ]