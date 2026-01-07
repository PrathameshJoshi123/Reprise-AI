from sqlalchemy import Column, Integer, String, Float, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class DiagnosticReport(Base):
    __tablename__ = "diagnostic_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    
    # Health scores from diagnostic app
    overall_health_score = Column(Float)  # 0-100
    battery_health = Column(Float)
    screen_health = Column(Float)
    camera_health = Column(Float)
    
    # Detailed test results (JSON)
    test_results = Column(JSON)  # {"touch": "pass", "speaker": "pass", etc.}
    
    # QR code for verification
    test_id = Column(String, unique=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="diagnostic_report")