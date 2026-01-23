from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from services.auth import models, schemas, utils
from shared.db.connections import get_db

router = APIRouter()

@router.post("/signup", response_model=schemas.UserOut, tags=["auth"])
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = utils.get_password_hash(user_in.password)
    user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        address=user_in.address,
        hashed_password=hashed,
        latitude=getattr(user_in, "latitude", None),
        longitude=getattr(user_in, "longitude", None),
        # New: set pincode from input
        pincode=user_in.pincode,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=schemas.Token, tags=["auth"])
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        (models.User.phone == payload.identifier) | (models.User.email == payload.identifier)
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive")
    if not utils.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    token = utils.create_access_token(data={"user_id": user.id})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.FullNameOut, tags=["auth"])
def read_me(current_user: models.User = Depends(utils.get_current_user)):
	# return only the full_name as requested
	return {"full_name": current_user.full_name}

@router.get("/me/details", response_model=schemas.UserOut, tags=["auth"])
def read_me_details(current_user: models.User = Depends(utils.get_current_user)):
    """
    Return full current user details useful for prefilling forms (phone, address, latitude, longitude, etc).
    """
    return current_user

@router.patch("/me", response_model=schemas.UserOut, tags=["auth"])
def update_current_user(
    payload: schemas.UserUpdate,
    current_user: models.User = Depends(utils.get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's profile fields. Only allowed fields are updated.
    Intended usage: save missing phone/address/coords during checkout.
    """
    # refresh user from this session
    user = db.query(models.User).filter(models.User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Only update non-null fields supplied in payload. Do NOT allow role/is_active changes here.
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.address is not None:
        user.address = payload.address
    if payload.latitude is not None:
        user.latitude = payload.latitude
    if payload.longitude is not None:
        user.longitude = payload.longitude
    # New: update pincode if provided
    if payload.pincode is not None:
        user.pincode = payload.pincode

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/users", response_model=list[schemas.UserOut], tags=["auth"])
def list_users(current_user: models.User = Depends(utils.get_current_user), db: Session = Depends(get_db)):
    # role-based admin protection removed; endpoint requires authentication
    return db.query(models.User).all()

@router.get("/users/{user_id}", response_model=schemas.UserOut, tags=["auth"])
def get_user(user_id: int, current_user: models.User = Depends(utils.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # allow only owner (previous admin shortcut removed)
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

@router.put("/users/{user_id}", response_model=schemas.UserOut, tags=["auth"])
def update_user(user_id: int, payload: schemas.UserUpdate, current_user: models.User = Depends(utils.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    # role change removed
    if payload.is_active is not None:
        # allow owner to toggle their is_active (no roles)
        user.is_active = payload.is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=204, tags=["auth"])
def delete_user(user_id: int, current_user: models.User = Depends(utils.get_current_user), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # allow only owner to delete their account (admin/role removed)
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    db.delete(user)
    db.commit()
    return None

@router.post("/google", response_model=schemas.Token, tags=["auth"])
def google_login(payload: schemas.GoogleLogin, db: Session = Depends(get_db)):
    # must receive auth_code
    if not getattr(payload, "auth_code", None):
        raise HTTPException(status_code=400, detail="auth_code is required")

    try:
        id_token = utils.exchange_auth_code_for_id_token(payload.auth_code, getattr(payload, "code_verifier", None))
        
    except HTTPException as e:
        # bubble up Google's exchange error with logging
        print("Token exchange failed:", e.detail)
        raise
    try:
        user = utils.create_or_get_user_from_google(id_token, db)
    except HTTPException as e:
        # verification or user creation failed — log and return informative error
        print("create_or_get_user_from_google failed:", e.detail)
        raise
    if not user:
        print("create_or_get_user_from_google returned no user for id_token")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Could not authenticate with Google")

    # create app JWT
    token_data = {"user_id": user.id}
    access_token = utils.create_access_token(data=token_data)
    
    return {"access_token": access_token, "token_type": "bearer"}
