from sqlalchemy import Column, Integer, String, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Photo(Base):
    __tablename__ = "photos"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    
    image_url = Column(String, nullable=False)
    
    # AI analysis results
    ai_detected_issues = Column(Boolean, default=False)
    ai_analysis = Column(JSON)  # {"cracks": true, "dents": false, "scratches": true}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="photos")