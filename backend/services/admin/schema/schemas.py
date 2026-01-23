from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
import re


# ============================================================================
# ADMIN AUTHENTICATION
# ============================================================================

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminOut


class AdminCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "admin"  # 'admin' or 'super_admin'


class AdminUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


# ============================================================================
# PARTNER MANAGEMENT
# ============================================================================

class PartnerOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: str
    company_name: Optional[str] = None
    business_address: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    verification_status: str
    rejection_reason: Optional[str] = None
    credit_balance: float
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        orm_mode = True


class PartnerVerificationHistoryOut(BaseModel):
    id: int
    partner_id: int
    action_by_admin_id: Optional[int] = None
    action_type: str
    message_from_admin: Optional[str] = None
    message_from_partner: Optional[str] = None
    documents_submitted: Optional[dict] = None
    created_at: datetime
    
    class Config:
        orm_mode = True


class PartnerServiceablePincodeOut(BaseModel):
    id: int
    partner_id: int
    pincode: str
    city: Optional[str] = None
    state: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True


class PartnerDetailsOut(BaseModel):
    partner: PartnerOut
    serviceable_pincodes: List[PartnerServiceablePincodeOut]
    verification_history: List[PartnerVerificationHistoryOut]


class RequestClarificationRequest(BaseModel):
    message: str
    required_documents: Optional[List[str]] = None


class ApprovePartnerRequest(BaseModel):
    approval_notes: Optional[str] = None


class RejectPartnerRequest(BaseModel):
    rejection_reason: str


# ============================================================================
# CREDIT MANAGEMENT
# ============================================================================

class CreditPlanOut(BaseModel):
    id: int
    plan_name: str
    credit_amount: float
    price: float
    bonus_percentage: float
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        orm_mode = True


class CreditPlanCreate(BaseModel):
    plan_name: str
    credit_amount: float
    price: float
    bonus_percentage: float = 0.0
    description: Optional[str] = None


class CreditPlanUpdate(BaseModel):
    plan_name: Optional[str] = None
    credit_amount: Optional[float] = None
    price: Optional[float] = None
    bonus_percentage: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PartnerCreditTransactionOut(BaseModel):
    id: int
    partner_id: int
    transaction_type: str
    amount: float
    balance_before: float
    balance_after: float
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    payment_method: Optional[str] = None
    payment_transaction_id: Optional[str] = None
    notes: Optional[str] = None
    created_by_admin_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        orm_mode = True


class AdjustCreditsRequest(BaseModel):
    amount: float
    notes: str


class AdminCreditConfigurationOut(BaseModel):
    id: int
    config_key: str
    config_value: str
    description: Optional[str] = None
    updated_by_admin_id: Optional[int] = None
    updated_at: datetime
    
    class Config:
        orm_mode = True


class UpdateConfigRequest(BaseModel):
    config_value: str


# ============================================================================
# DASHBOARD & ANALYTICS
# ============================================================================

class DashboardStats(BaseModel):
    total_customers: int
    total_partners: int
    active_partners: int
    pending_verifications: int
    total_agents: int
    total_orders: int
    orders_by_status: dict
    total_revenue: float
    credits_in_circulation: float


# ============================================================================
# LEGACY SCHEMAS (for existing admin endpoints)
# ============================================================================

from services.auth.schemas import UserBase

class AdminUserCreate(UserBase):
    password: str
    role: str = "customer"


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AdminUserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str

    class Config:
        orm_mode = True


class AdminOrderOut(BaseModel):
    id: int
    phone_name: str
    customer_name: str
    agent_name: Optional[str] = None
    status: str
    quoted_price: float
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


from services.sell_phone.schema.schemas import OrderOut
