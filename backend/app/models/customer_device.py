from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=True)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="customer")


class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String, nullable=False)  # Apple, Samsung, Dell, etc.
    model = Column(String, nullable=False)  # iPhone 13, MacBook Air M1
    imei = Column(String, unique=True, nullable=True)  # For phones
    serial_number = Column(String, unique=True, nullable=True)  # For laptops
    
    # Relationships
    transaction = relationship("Transaction", back_populates="device")
