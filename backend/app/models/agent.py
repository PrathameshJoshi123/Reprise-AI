from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    
    # Location tracking
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Performance metrics
    total_jobs_completed = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    average_inspection_time = Column(Float, default=0.0)  # in minutes
    
    # Relationships
    transactions = relationship("Transaction", back_populates="agent")