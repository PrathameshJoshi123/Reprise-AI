from fastapi import APIRouter, Depends, Query, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from shared.db.connections import get_db
from ..schema.models import PhoneList, Order
from ..schema import schemas as sell_schemas
from services.auth import utils as auth_utils, models as auth_models
from math import ceil
from datetime import datetime
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

router = APIRouter(prefix="/sell-phone", tags=["Sell Phone"])

# New: simple geocoder (Nominatim via geopy)
_geolocator = Nominatim(user_agent="repriseai_geocoder")
_geocode = RateLimiter(_geolocator.geocode, min_delay_seconds=1, max_retries=2, error_wait_seconds=2)

def geocode_address(address: str):
    if not address:
        return None, None
    try:
        loc = _geocode(address)
        if loc:
            return float(loc.latitude), float(loc.longitude)
    except Exception:
        pass
    return None, None

@router.get("/phones")
def get_phones_list(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: str = Query(None, description="Search query for Brand or Model")
):
    # Subquery to get unique Brand + Model combinations, selecting the max id for each
    subquery = db.query(
        PhoneList.Brand,
        PhoneList.Model,
        func.max(PhoneList.id).label('max_id')
    ).group_by(PhoneList.Brand, PhoneList.Model).subquery()
    
    query = db.query(PhoneList).join(subquery, PhoneList.id == subquery.c.max_id)
    
    if search:
        # Decode '+' back to spaces for proper search
        search = search.replace('+', ' ')
        query = query.filter(
            PhoneList.Brand.ilike(f"%{search}%") | PhoneList.Model.ilike(f"%{search}%")
        )
    
    total = query.count()
    phones = query.offset((page - 1) * limit).limit(limit).all()
    total_pages = ceil(total / limit)
    
    return {
        "phones": [phone.__dict__ for phone in phones],  # Exclude SQLAlchemy internals
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages
    }

@router.get("/phones/{phone_id}")
def get_phone(phone_id: int, db: Session = Depends(get_db)):
    phone = db.query(PhoneList).filter(PhoneList.id == phone_id).first()
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    return phone.__dict__

@router.get("/phones/{phone_id}/variants")
def get_phone_variants(phone_id: int, db: Session = Depends(get_db)):
    phone = db.query(PhoneList).filter(PhoneList.id == phone_id).first()
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    
    variants = db.query(PhoneList.RAM_GB, PhoneList.Internal_Storage_GB).filter(
        PhoneList.Brand == phone.Brand,
        PhoneList.Model == phone.Model
    ).distinct().all()
    
    rams = sorted(set(v.RAM_GB for v in variants))
    storages = sorted(set(v.Internal_Storage_GB for v in variants))
    
    return {"rams": rams, "storages": storages}

@router.get("/phones/{phone_id}/price")
def get_phone_variant_price(
    phone_id: int,
    ram_gb: int = Query(..., description="RAM in GB"),
    storage_gb: int = Query(..., description="Storage in GB"),
    db: Session = Depends(get_db)
):
    phone = db.query(PhoneList).filter(PhoneList.id == phone_id).first()
    if not phone:
        raise HTTPException(status_code=404, detail="Phone not found")
    
    variant = db.query(PhoneList.Selling_Price).filter(
        PhoneList.Brand == phone.Brand,
        PhoneList.Model == phone.Model,
        PhoneList.RAM_GB == ram_gb,
        PhoneList.Internal_Storage_GB == storage_gb
    ).first()
    
    if not variant:
        raise HTTPException(status_code=404, detail="Variant not found")
    
    return {"base_price": variant.Selling_Price}

@router.post("/orders", response_model=sell_schemas.OrderOut, status_code=201)
def create_order(
	payload: sell_schemas.OrderCreate,
	current_user: auth_models.User = Depends(auth_utils.get_current_user),
	db: Session = Depends(get_db),
):
	"""
	Create an order linked to current authenticated user.
	"""
	order = Order(
		user_id=current_user.id,
		phone_name=payload.phone_name,
		brand=payload.brand,
		model=payload.model,
		ram_gb=payload.ram_gb,
		storage_gb=payload.storage_gb,
		variant=payload.variant,
		condition=payload.condition,
		quoted_price=payload.quoted_price,
		customer_name=payload.customer_name or current_user.full_name,
		phone_number=payload.phone_number or current_user.phone,
		email=payload.email or current_user.email,
		address_line=payload.address_line,
		city=payload.city,
		state=payload.state,
		pincode=payload.pincode,
		pickup_date=payload.pickup_date,
		pickup_time=payload.pickup_time,
		payment_method=payload.payment_method,
		status="pending",
		pickup_latitude=payload.pickup_latitude,
		pickup_longitude=payload.pickup_longitude,
	)
	# If pickup coords not supplied, attempt to geocode the provided address
	if (order.pickup_latitude is None or order.pickup_longitude is None):
		addr_parts = [
			order.address_line or "",
			order.city or "",
			order.state or "",
			order.pincode or ""
		]
		full_addr = ", ".join([p.strip() for p in addr_parts if p.strip()])
		lat, lon = geocode_address(full_addr)
		if lat is not None and lon is not None:
			order.pickup_latitude = lat
			order.pickup_longitude = lon

	db.add(order)
	db.commit()
	db.refresh(order)
	return order

@router.get("/my-orders", response_model=list[sell_schemas.OrderOut])
def get_my_orders(
	db: Session = Depends(get_db),
	current_user: auth_models.User = Depends(auth_utils.get_current_user),
):
	"""
	Get orders for the current user.
	"""
	query = db.query(Order).filter(Order.user_id == current_user.id)
	return query.order_by(Order.created_at.desc()).all()
