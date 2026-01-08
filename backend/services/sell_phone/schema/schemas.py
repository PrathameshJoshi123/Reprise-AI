from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class OrderCreate(BaseModel):
	# phone / variant info
	phone_name: str
	brand: Optional[str] = None
	model: Optional[str] = None
	ram_gb: Optional[float] = None
	storage_gb: Optional[float] = None
	variant: Optional[str] = None
	condition: Optional[str] = None
	quoted_price: float = 0.0

	# customer / pickup details
	customer_name: Optional[str] = None
	phone_number: Optional[str] = None
	email: Optional[EmailStr] = None
	address_line: Optional[str] = None
	city: Optional[str] = None
	state: Optional[str] = None
	pincode: Optional[str] = None
	pickup_date: Optional[datetime] = None
	pickup_time: Optional[str] = None

	# New: optional pickup coordinates
	pickup_latitude: Optional[float] = None
	pickup_longitude: Optional[float] = None

	payment_method: Optional[str] = None

	class Config:
		schema_extra = {
			"example": {
				"phone_name": "iPhone 13 Pro",
				"brand": "Apple",
				"model": "13 Pro",
				"variant": "256GB",
				"condition": "Good",
				"quoted_price": 40000,
				"customer_name": "John Doe",
				"phone_number": "+919876543210",
				"email": "john@example.com",
				"address_line": "Flat 12, Example Street",
				"city": "Mumbai",
				"state": "Maharashtra",
				"pincode": "400001",
				"pickup_date": None,
				"payment_method": "upi"
			}
		}

class OrderOut(BaseModel):
	id: int
	user_id: Optional[int] = None
	phone_name: str
	variant: Optional[str] = None
	quoted_price: float
	status: str
	customer_name: Optional[str] = None
	phone_number: Optional[str] = None
	email: Optional[EmailStr] = None
	address_line: Optional[str] = None
	city: Optional[str] = None
	state: Optional[str] = None
	pincode: Optional[str] = None
	pickup_date: Optional[datetime] = None
	pickup_time: Optional[str] = None

	# New: include pickup coords in output
	pickup_latitude: Optional[float] = None
	pickup_longitude: Optional[float] = None

	payment_method: Optional[str] = None
	agent_id: Optional[int] = None
	agent_name: Optional[str] = None
	agent_phone: Optional[str] = None
	accepted_at: Optional[datetime] = None
	created_at: datetime

	class Config:
		orm_mode = True
