from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from services.auth.schemas import UserBase  # keep for AdminUserCreate

# For creating users (agents or customers) - extends UserBase
class AdminUserCreate(UserBase):
    password: str
    role: str = "customer"  # Default to customer, but admin can set to agent

# For updating users - similar to auth's UserUpdate but admin-specific
class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None  # Allow changing role (e.g., customer to agent)
    is_active: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

# Minimal response model for admin users (only expose safe, needed fields)
class AdminUserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str

    class Config:
        orm_mode = True

# Minimal response model for admin orders (only expose fields shown in admin UI)
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

# For orders, reuse from sell_phone
from services.sell_phone.schema.schemas import OrderOut
