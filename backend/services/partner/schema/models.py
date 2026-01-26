from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.sql import func
from backend.shared.db.connections import Base


class Partner(Base):
    """
    Partners who purchase leads and manage agents.
    Separate from users table (customers only).
    """
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    company_name = Column(String, nullable=True)
    business_address = Column(String, nullable=True)
    gst_number = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    
    # Verification status: 'pending', 'under_review', 'clarification_needed', 'approved', 'rejected', 'suspended'
    verification_status = Column(String, nullable=False, default='pending', index=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Credit management
    credit_balance = Column(Float, nullable=False, default=0.0)
    
    # Account status
    is_active = Column(Boolean, default=True, index=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class PartnerServiceablePincode(Base):
    """
    Defines which pincodes each partner can service.
    Used for lead routing - only partners with matching pincodes see the lead.
    """
    __tablename__ = "partner_serviceable_pincodes"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, index=True)
    pincode = Column(String, nullable=False, index=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Agent(Base):
    """
    Agents who work for partners to complete pickups.
    Each agent belongs to one partner.
    """
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Agent credentials
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    # Agent details
    full_name = Column(String, nullable=False)
    employee_id = Column(String, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
