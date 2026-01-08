from fastapi import APIRouter, Depends, Query, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from shared.db.connections import get_db
from ..schema.models import PhoneList, Order
from ..schema import schemas as sell_schemas
from services.auth import models as auth_models, utils as auth_utils
from math import ceil, radians, sin, cos, atan2, sqrt
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

@router.get("/orders", response_model=list[sell_schemas.OrderOut])
def list_orders(
	status: str = Query(None, description="Filter by status"),
	for_user: int = Query(None, description="Filter by user_id"),
	for_agent: int = Query(None, description="Filter by agent_id"),
	db: Session = Depends(get_db),
	current_user: auth_models.User = Depends(auth_utils.get_current_user),
):
	"""
	List orders. By default returns:
	- if current_user.role == 'agent' -> orders assigned to that agent or pending
	- else if for_user provided -> filter by that user (admin or owner)
	- else return recent orders (admin only)
	"""
	query = db.query(Order)

	# agents see orders assigned to them or pending
	if current_user.role == "agent":
		if status:
			query = query.filter(Order.status == status)
		else:
			query = query.filter((Order.agent_id == current_user.id) | (Order.status == "pending"))
		return query.order_by(Order.created_at.desc()).all()

	# customers can fetch their orders
	if current_user.role in ("customer", "user"):
		query = query.filter(Order.user_id == current_user.id)
		if status:
			query = query.filter(Order.status == status)
		return query.order_by(Order.created_at.desc()).all()

	# admin or other: allow optional filters
	if for_user:
		query = query.filter(Order.user_id == for_user)
	if for_agent:
		query = query.filter(Order.agent_id == for_agent)
	if status:
		query = query.filter(Order.status == status)
	return query.order_by(Order.created_at.desc()).all()

@router.post("/orders/{order_id}/accept", response_model=sell_schemas.OrderOut)
def accept_order(
	order_id: int,
	current_agent: auth_models.User = Depends(auth_utils.require_role(["agent"])),
	db: Session = Depends(get_db),
):
	"""
	Agent accepts an order. Sets agent_id, agent_name, accepted_at, status=accepted.
	"""
	order = db.query(Order).filter(Order.id == order_id).first()
	if not order:
		raise HTTPException(status_code=404, detail="Order not found")
	if order.status != "pending":
		raise HTTPException(status_code=400, detail="Order is not pending")

	# Fetch the agent from THIS DB session to ensure we have authoritative fields to persist
	agent = db.query(auth_models.User).filter(auth_models.User.id == current_agent.id).first()
	if not agent:
		raise HTTPException(status_code=404, detail="Agent not found")

	order.agent_id = agent.id
	order.agent_name = agent.full_name or agent.email
	order.agent_phone = agent.phone
	order.accepted_at = datetime.utcnow()
	order.status = "accepted"

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
	Get orders for the current user based on their role.
	- Customers: Their own orders.
	- Agents: Assigned or pending orders.
	- Admins: All orders (fallback).
	"""
	query = db.query(Order)

	if current_user.role == "agent":
		query = query.filter((Order.agent_id == current_user.id) | (Order.status == "pending"))
	elif current_user.role in ("customer", "user"):
		query = query.filter(Order.user_id == current_user.id)
	# For admins or others, return all (or add specific logic if needed)

	return query.order_by(Order.created_at.desc()).all()

@router.get("/agent/orders", response_model=list[sell_schemas.OrderOut])
def list_orders_for_agent(
    status: str = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_agent: auth_models.User = Depends(auth_utils.require_role(["agent"])),
):
    """
    Agent-only endpoint: returns orders assigned to this agent.
    Optional status filter allowed.
    """
    query = db.query(Order)
    # Only return orders explicitly assigned to this agent
    query = query.filter(Order.agent_id == current_agent.id)
    if status:
        query = query.filter(Order.status == status)
    return query.order_by(Order.created_at.desc()).all()

# add small helper to coerce to float safely and try several attribute names for coords
def _to_float(v):
	try:
		return float(v)
	except Exception:
		return None

def _get_coords_from_obj(obj):
	# try common attribute names for latitude & longitude on user/order models,
	# including pickup_* variants stored on Order records.
	lat_keys = (
		"pickup_latitude", "pickupLatitude", "pickup_lat", "latitude", "lat",
		"location_lat", "locationLatitude", "location_latitude"
	)
	lon_keys = (
		"pickup_longitude", "pickupLongitude", "pickup_lon", "longitude", "lng", "lon",
		"location_lon", "locationLongitude", "location_longitude"
	)
	lat = None
	lon = None
	for k in lat_keys:
		if hasattr(obj, k):
			lat = _to_float(getattr(obj, k))
			if lat is not None:
				break
	for k in lon_keys:
		if hasattr(obj, k):
			lon = _to_float(getattr(obj, k))
			if lon is not None:
				break
	# final check
	if lat is None or lon is None:
		return None, None
	return lat, lon

# replace haversine implementation with clearer version
def haversine_km(lat1, lon1, lat2, lon2):
	R = 6371.0  # Earth radius in km
	phi1 = radians(lat1)
	phi2 = radians(lat2)
	dphi = radians(lat2 - lat1)
	dlambda = radians(lon2 - lon1)
	a = sin(dphi / 2.0) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2.0) ** 2
	c = 2 * atan2(sqrt(a), sqrt(1 - a))
	return R * c

@router.get("/agent/nearby-orders", response_model=list[sell_schemas.OrderOut])
def nearby_orders_for_agent(
	radius_km: float = Query(5.0, description="Radius in kilometers"),
	db: Session = Depends(get_db),
	current_agent: auth_models.User = Depends(auth_utils.require_role(["agent"])),
):
	"""
	Order matching steps (exact):
	1. Refresh agent from DB (so we can persist geocoded coords).
	2. Try to read agent coordinates via _get_coords_from_obj (checks many field names).
	3. If missing, use agent.address and geocode; persist latitude/longitude on agent record.
	4. Query all orders with status == "pending".
	5. For each order:
	   a. Try to read pickup coordinates via _get_coords_from_obj (includes pickup_* variants).
	   b. If missing, use order.address_line and geocode; persist pickup_latitude/pickup_longitude on the order record.
	   c. If still missing coords, skip the order.
	   d. Compute haversine distance between agent coords and order pickup coords.
	   e. If distance <= radius_km, include order in results.
	6. Sort included orders by ascending distance (closest first) and return.
	"""
	# Ensure we have the agent fresh from this DB session so we can persist geocode results
	agent = db.query(auth_models.User).filter(auth_models.User.id == current_agent.id).first()

	# try multiple fields for agent coordinates first
	agent_lat, agent_lon = _get_coords_from_obj(agent)

	# If agent coords missing, try geocoding the agent.address field and persist
	if (agent_lat is None or agent_lon is None):
		# prefer explicit "address" field on the User model
		addr = getattr(agent, "address", None)
		if addr:
			lat, lon = geocode_address(addr)
			if lat is not None and lon is not None:
				agent.latitude = lat
				agent.longitude = lon
				db.add(agent)
				db.commit()
				db.refresh(agent)
				agent_lat, agent_lon = lat, lon

	if agent_lat is None or agent_lon is None:
		raise HTTPException(status_code=400, detail="Agent location not set and could not be geocoded. Please set a valid address on your profile.")

	# fetch pending orders (attempt to geocode any missing pickup coords)
	candidates = db.query(Order).filter(Order.status == "pending").all()
	print("candidates:", len(candidates))
	nearby = []
	for o in candidates:
		# try to read coords from order using multiple attribute names
		o_lat, o_lon = _get_coords_from_obj(o)

		# if order lacks pickup coords, attempt to geocode from its address_line and persist
		if (o_lat is None or o_lon is None):
			# prefer explicit "address_line" on Order model
			addr = getattr(o, "address_line", None)
			if addr:
				lat, lon = geocode_address(addr)
				print("geocoded order", o.id, "address:", addr, "to:", lat, lon)
				if lat is not None and lon is not None:
					o.pickup_latitude = lat
					o.pickup_longitude = lon
					db.add(o)
					db.commit()
					db.refresh(o)
					o_lat, o_lon = lat, lon

		# skip if still missing coords
		if o_lat is None or o_lon is None:
			continue

		# calculate distance safely
		try:
			dist = haversine_km(agent_lat, agent_lon, float(o_lat), float(o_lon))
		except Exception:
			# skip orders with bad coordinate values
			continue
		if dist <= radius_km:
			nearby.append(o)

	# sort by closest first; guard against potential errors in distance calc
	try:
		nearby.sort(key=lambda x: haversine_km(agent_lat, agent_lon, float(getattr(x, "pickup_latitude")), float(getattr(x, "pickup_longitude"))))
	except Exception:
		pass

	return nearby
