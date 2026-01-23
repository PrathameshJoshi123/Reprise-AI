from pydantic import BaseModel, EmailStr, validator
from typing import Optional
import re

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
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
    # allow updating coords from client
    latitude: Optional[float] = None
    longitude: Optional[float] = None
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
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # New: include pincode in output
    pincode: Optional[str] = None

    class Config:
        orm_mode = True

# new: minimal response for /me
class FullNameOut(BaseModel):
    full_name: Optional[str] = None

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
    
    class Config:
        orm_mode = True
