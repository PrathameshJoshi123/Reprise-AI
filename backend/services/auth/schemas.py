from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import re

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    # New: optional pincode for customer
    pincode: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('pincode')
    def validate_pincode(cls, v):
        """Validate pincode format (6 digits for India)"""
        if v is not None and v.strip():
            if not re.match(r'^\d{6}$', v.strip()):
                raise ValueError('Pincode must be exactly 6 digits')
        return v.strip() if v else v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: Optional[bool] = None
    # coords removed
    # New: allow updating pincode
    pincode: Optional[str] = None
    
    @validator('pincode')
    def validate_pincode(cls, v):
        """Validate pincode format (6 digits for India)"""
        if v is not None and v.strip():
            if not re.match(r'^\d{6}$', v.strip()):
                raise ValueError('Pincode must be exactly 6 digits')
        return v.strip() if v else v

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    # New: include pincode in output
    pincode: Optional[str] = None
    # Role inferred by backend: 'customer', 'agent', 'partner', 'admin'
    role: Optional[str] = None

    # Pydantic v2: use `model_config` to enable attribute access
    model_config = {"from_attributes": True}

# new: minimal response for /me
class FullNameOut(BaseModel):
    full_name: Optional[str] = None


# Profile output without exposing internal `id` field
class ProfileOut(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    pincode: Optional[str] = None

    model_config = {"from_attributes": True}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: int

class UserLogin(BaseModel):
    identifier: str  # email or phone
    password: str

class GoogleLogin(BaseModel):
    auth_code: str
    code_verifier: Optional[str] = None


class UserRegistrationResponse(BaseModel):
    """
    Enhanced registration response with pincode serviceability info.
    Informs customer if partners service their area.
    """
    user: UserOut
    serviceable: bool
    serviceable_partners_count: int = 0
    warning: Optional[str] = None
    
    model_config = {"from_attributes": True}
