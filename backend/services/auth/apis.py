from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from services.auth import models, schemas, utils
from shared.db.connections import Base, engine

router = APIRouter()

# ensure tables exist
Base.metadata.create_all(bind=engine)

@router.post("/signup", response_model=schemas.UserOut, tags=["auth"])
def signup(user_in: schemas.UserCreate, db: Session = Depends(utils.get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = utils.get_password_hash(user_in.password)
    user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        hashed_password=hashed,
        role=user_in.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=schemas.Token, tags=["auth"])
def login(payload: schemas.UserLogin, db: Session = Depends(utils.get_db)):
    user = db.query(models.User).filter(
        (models.User.email == payload.identifier) | (models.User.phone == payload.identifier)
    ).first()
    if not user or not utils.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    token = utils.create_access_token(data={"user_id": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut, tags=["auth"])
def read_me(current_user: models.User = Depends(utils.get_current_user)):
    return current_user

@router.get("/users", response_model=list[schemas.UserOut], tags=["auth"])
def list_users(admin: models.User = Depends(utils.require_role(["admin"])), db: Session = Depends(utils.get_db)):
    return db.query(models.User).all()

@router.get("/users/{user_id}", response_model=schemas.UserOut, tags=["auth"])
def get_user(user_id: int, current_user: models.User = Depends(utils.get_current_user), db: Session = Depends(utils.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # allow admin or owner
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

@router.put("/users/{user_id}", response_model=schemas.UserOut, tags=["auth"])
def update_user(user_id: int, payload: schemas.UserUpdate, current_user: models.User = Depends(utils.get_current_user), db: Session = Depends(utils.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.phone is not None:
        user.phone = payload.phone
    if payload.role is not None:
        # only admin can change roles
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admin can change roles")
        user.role = payload.role
    if payload.is_active is not None:
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only admin can change active status")
        user.is_active = payload.is_active
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=204, tags=["auth"])
def delete_user(user_id: int, admin: models.User = Depends(utils.require_role(["admin"])), db: Session = Depends(utils.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None
