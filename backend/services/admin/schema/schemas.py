from pydantic import BaseModel, EmailStr
from typing import Optional
from services.auth.schemas import UserBase, UserOut  # Reuse existing schemas

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

# Reuse UserOut for listing users
# For orders, reuse from sell_phone
from services.sell_phone.schema.schemas import OrderOut
