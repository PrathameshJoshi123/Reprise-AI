from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ================================
# PARTNER SCHEMAS
# ================================

class PartnerApplicationCreate(BaseModel):
    """Schema for partner application (signup)"""
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    company_name: str = Field(..., min_length=2, max_length=200)
    business_address: str = Field(..., min_length=10, max_length=500)
    gst_number: Optional[str] = Field(None, min_length=15, max_length=15)
    pan_number: str = Field(..., min_length=10, max_length=10)
    serviceable_pincodes: List[str] = Field(..., min_items=1, description="List of pincodes the partner can service")


class PartnerLogin(BaseModel):
    """Schema for partner login"""
    email: EmailStr
    password: str


class PartnerOut(BaseModel):
    """Schema for partner response"""
    id: int
    email: str
    full_name: str
    phone: str
    company_name: Optional[str]
    business_address: Optional[str]
    gst_number: Optional[str]
    pan_number: Optional[str]
    verification_status: str
    credit_balance: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PartnerCreditNameOut(BaseModel):
    """Schema for partner credit and name only"""
    full_name: str
    credit_balance: float

    model_config = {"from_attributes": True}


class PartnerToken(BaseModel):
    """Schema for partner authentication token"""
    access_token: str
    token_type: str = "bearer"
    partner: PartnerOut

# Minimal order summary for partner orders listing
class PartnerOrderBriefOut(BaseModel):
    id: int
    phone_name: str
    ram_gb: Optional[float] = None
    storage_gb: Optional[float] = None
    status: str
    ai_estimated_price: Optional[float] = None
    ai_reasoning: Optional[str] = None
    customer_name: Optional[str] = None
    agent_name: Optional[str] = None
    customer_condition_answers: Optional[dict] = None
    created_at: datetime
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    pickup_address_line: Optional[str] = None
    pickup_city: Optional[str] = None
    pickup_state: Optional[str] = None

    model_config = {"from_attributes": True}


# ================================
# AGENT SCHEMAS
# ================================

class AgentCreate(BaseModel):
    """Schema for creating a new agent"""
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    employee_id: Optional[str] = None


class AgentUpdate(BaseModel):
    """Schema for updating agent details"""
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    employee_id: Optional[str] = None
    is_active: Optional[bool] = None


class AgentOut(BaseModel):
    """Schema for agent response"""
    id: int
    partner_id: int
    email: str
    phone: str
    full_name: str
    employee_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentNameOut(BaseModel):
    """Schema for agent name only"""
    full_name: str

    model_config = {"from_attributes": True}


class AgentLogin(BaseModel):
    """Schema for agent login"""
    email: EmailStr
    password: str


class AgentToken(BaseModel):
    """Schema for agent authentication token"""
    access_token: str
    token_type: str = "bearer"
    agent: AgentOut


# ================================
# AGENT ORDER SCHEMAS
# ================================

class AgentOrderSummary(BaseModel):
    """Summary of order for agent dashboard"""
    order_id: int
    phone_name: str
    brand: str
    model: str
    condition: str
    quoted_price: float
    status: str
    customer_name: str
    customer_phone: str
    pickup_address: str
    pickup_date: Optional[str]
    pickup_time: Optional[str]
    assigned_at: Optional[datetime]
    accepted_at: Optional[datetime]
    
    model_config = {"from_attributes": True}


class SchedulePickupRequest(BaseModel):
    """Schema for scheduling pickup"""
    scheduled_date: str  # YYYY-MM-DD format
    scheduled_time: str  # HH:MM format
    notes: Optional[str] = None


class CompletePickupRequest(BaseModel):
    """Schema for completing pickup"""
    actual_condition: str = Field(..., description="Actual condition observed during pickup")
    final_offered_price: float = Field(..., ge=0, description="Final price offered to customer")
    customer_accepted: bool = Field(..., description="Whether customer accepted the offer")
    pickup_notes: Optional[str] = None
    payment_method: Optional[str] = Field(None, description="Cash/UPI/Bank Transfer")


class ProcessPaymentRequest(BaseModel):
    """Schema for processing payment"""
    payment_amount: float = Field(..., ge=0)
    payment_method: str = Field(..., description="Cash/UPI/Bank Transfer/Cheque")
    transaction_id: Optional[str] = None
    payment_notes: Optional[str] = None


class ReschedulePickupRequest(BaseModel):
    """Schema for rescheduling pickup"""
    new_date: str  # YYYY-MM-DD format
    new_time: str  # HH:MM format
    reschedule_reason: str = Field(..., min_length=5, max_length=500)
    notes: Optional[str] = None


class CancelPickupRequest(BaseModel):
    """Schema for canceling pickup"""
    cancellation_reason: str = Field(..., min_length=10, max_length=500)
    notes: Optional[str] = None


class AgentLocationUpdate(BaseModel):
    """Schema for updating agent location"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
