from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class TransactionStatus(str, enum.Enum):
    WAITING = "waiting"
    AGENT_ON_WAY = "agent_on_way"
    INSPECTING = "inspecting"
    COMPLETED = "completed"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    agent_id = Column(Integer, ForeignKey("agents.id"))
    device_id = Column(Integer, ForeignKey("devices.id"))
    
    status = Column(Enum(TransactionStatus), default=TransactionStatus.WAITING)
    
    estimated_price = Column(Float)  # AI's initial guess
    final_price = Column(Float, nullable=True)  # Actual price paid
    
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    customer = relationship("Customer", back_populates="transactions")
    agent = relationship("Agent", back_populates="transactions")
    device = relationship("Device", back_populates="transaction")
    diagnostic_report = relationship("DiagnosticReport", back_populates="transaction", uselist=False)
    photos = relationship("Photo", back_populates="transaction")