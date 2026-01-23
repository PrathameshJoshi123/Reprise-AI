from pydantic import BaseModel, EmailStr
from typing import Optional

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
