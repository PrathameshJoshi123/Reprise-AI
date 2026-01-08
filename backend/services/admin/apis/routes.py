from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, load_only
from shared.db.connections import get_db
from services.auth import models as auth_models, utils as auth_utils
from services.sell_phone.schema import models as sell_models
from ..schema.schemas import (
    AdminUserCreate,
    AdminUserUpdate,
    AdminUserOut,
    AdminOrderOut,
)

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    role: str = None,  # Optional filter: "agent" or "customer"
    db: Session = Depends(get_db),
    current_admin: auth_models.User = Depends(auth_utils.require_role(["admin"])),
):
    """
    List users — only load fields required by the admin UI to avoid fetching everything.
    """
    query = db.query(auth_models.User).options(
        load_only(
            auth_models.User.id,
            auth_models.User.email,
            auth_models.User.full_name,
            auth_models.User.role,
        )
    )
    if role:
        query = query.filter(auth_models.User.role == role)
    # Exclude other admins for security
    query = query.filter(auth_models.User.role.in_(["agent", "customer"]))
    return query.all()

@router.post("/users", response_model=AdminUserOut, status_code=201)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    current_admin: auth_models.User = Depends(auth_utils.require_role(["admin"])),
):
    """
    Create a new user (agent or customer).
    """
    # Check if email or phone already exists
    existing = db.query(auth_models.User).filter(
        (auth_models.User.email == payload.email) | (auth_models.User.phone == payload.phone)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email or phone already exists")
    
    hashed_password = auth_utils.get_password_hash(payload.password)
    user = auth_models.User(
        email=payload.email,
        full_name=payload.full_name,
        phone=payload.phone,
        address=payload.address,
        role=payload.role,
        latitude=payload.latitude,
        longitude=payload.longitude,
        hashed_password=hashed_password,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/{user_id}", response_model=AdminUserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: auth_models.User = Depends(auth_utils.require_role(["admin"])),
):
    """
    Update a user (agent or customer). Cannot update other admins.
    """
    user = db.query(auth_models.User).filter(auth_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot modify other admins")
    
    # Update fields if provided
    for field, value in payload.dict(exclude_unset=True).items():
        if field == "password" and value:
            setattr(user, "hashed_password", auth_utils.get_password_hash(value))
        else:
            setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: auth_models.User = Depends(auth_utils.require_role(["admin"])),
):
    """
    Delete a user (agent or customer). Cannot delete other admins or self.
    """
    user = db.query(auth_models.User).filter(auth_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin" or user.id == current_admin.id:
        raise HTTPException(status_code=403, detail="Cannot delete admins or yourself")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.get("/orders", response_model=list[AdminOrderOut])
def list_orders(
    status: str = None,  # Optional filter by order status
    db: Session = Depends(get_db),
    current_admin: auth_models.User = Depends(auth_utils.require_role(["admin"])),
):
    """
    List orders — only load fields required by the admin UI to avoid fetching everything.
    """
    query = db.query(sell_models.Order).options(
        load_only(
            sell_models.Order.id,
            sell_models.Order.phone_name,
            sell_models.Order.customer_name,
            sell_models.Order.agent_name,
            sell_models.Order.status,
            sell_models.Order.quoted_price,
            sell_models.Order.created_at,
        )
    )
    if status:
        query = query.filter(sell_models.Order.status == status)
    return query.order_by(sell_models.Order.created_at.desc()).all()
