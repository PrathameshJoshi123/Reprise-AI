from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.transaction import Transaction
from app.schemas.job import JobResponse, JobUpdate

router = APIRouter(prefix="/jobs", tags=["Job Management"])

@router.get("/", response_model=List[JobResponse])
async def get_all_jobs(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db)
):
    """
    Get all jobs with optional filtering by status
    """
    query = db.query(Transaction)
    
    if status:
        query = query.filter(Transaction.status == status)
    
    jobs = query.offset(skip).limit(limit).all()
    
    return [
        JobResponse(
            id=job.id,
            customer_name=job.customer.name,
            device_model=f"{job.device.brand} {job.device.model}",
            agent_name=job.agent.name if job.agent else "Unassigned",
            status=job.status,
            final_price=job.final_price,
            created_at=job.created_at
        )
        for job in jobs
    ]

@router.get("/{job_id}", response_model=JobResponse)
async def get_job_details(job_id: int, db: Session = Depends(get_db)):
    """
    Get detailed information about a specific job
    """
    job = db.query(Transaction).filter(Transaction.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobResponse(
        id=job.id,
        customer_name=job.customer.name,
        device_model=f"{job.device.brand} {job.device.model}",
        agent_name=job.agent.name if job.agent else "Unassigned",
        status=job.status,
        final_price=job.final_price,
        created_at=job.created_at,
        photos=[photo.image_url for photo in job.photos],
        diagnostic_score=job.diagnostic_report.overall_health_score if job.diagnostic_report else None
    )