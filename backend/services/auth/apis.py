from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from services.auth import models, schemas, utils
from shared.db.connections import Base, engine
from authlib.integrations.starlette_client import OAuth
import os

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL")

router = APIRouter()

# ensure tables exist
Base.metadata.create_all(bind=engine)

# Initialize OAuth with Starlette
oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

@router.post("/signup", response_model=schemas.UserOut, tags=["auth"])
def signup(user_in: schemas.UserCreate, db: Session = Depends(utils.get_db)):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    # require address only for agents (customers can omit address at signup)
    if getattr(user_in, "role", "customer") == "agent":
        if not user_in.address or not user_in.address.strip():
            raise HTTPException(status_code=400, detail="Address is required for agents")
    hashed = utils.get_password_hash(user_in.password)
    # include optional geolocation if provided
    user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        address=user_in.address,
        hashed_password=hashed,
        role=user_in.role,
        latitude=getattr(user_in, "latitude", None),
        longitude=getattr(user_in, "longitude", None),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=schemas.Token, tags=["auth"])
def login(payload: schemas.UserLogin, db: Session = Depends(utils.get_db)):
    user = db.query(models.User).filter(
        (models.User.phone == payload.identifier) | (models.User.email == payload.identifier)
    ).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is inactive")
    if not utils.verify_password(payload.password, user.hashed_password):
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


# Google OAuth Routes
@router.get("/google/login", tags=["auth", "oauth"])
async def google_login(request: Request):
    """Initiate Google OAuth login flow"""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    redirect_uri = GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", tags=["auth", "oauth"])
async def google_callback(request: Request, db: Session = Depends(utils.get_db)):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")
        
        email = user_info.get('email')
        google_id = user_info.get('sub')
        full_name = user_info.get('name')
        
        if not email or not google_id:
            raise HTTPException(status_code=400, detail="Email or Google ID not provided")
        
        # Check if user exists by google_id or email
        user = db.query(models.User).filter(
            (models.User.google_id == google_id) | (models.User.email == email)
        ).first()
        
        if user:
            # Update existing user with google_id if not set
            if not user.google_id:
                user.google_id = google_id
                user.oauth_provider = 'google'
                db.add(user)
                db.commit()
                db.refresh(user)
        else:
            # Create new user
            user = models.User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                oauth_provider='google',
                role='customer',
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create access token and include it in the redirect fragment
        access_token = utils.create_access_token(data={"user_id": user.id, "role": user.role})

        # Redirect to frontend callback page with token in URL fragment (not sent to server)
        # Using fragment keeps token out of server logs and avoids session-cookie exchange.
        return RedirectResponse(url=f"{FRONTEND_URL}/oauth/callback#access_token={access_token}")
        
    except Exception as e:
        # Redirect to frontend with error
        return RedirectResponse(url=f"{FRONTEND_URL}/oauth/callback?error={str(e)}")


@router.post("/google/token", response_model=schemas.Token, tags=["auth", "oauth"])
async def google_exchange_token(request: Request):
    """Exchange OAuth session for access token"""
    # Check if user authenticated via OAuth
    user_id = request.session.get('oauth_user_id')
    user_role = request.session.get('oauth_user_role')
    
    if not user_id or not user_role:
        raise HTTPException(status_code=401, detail="No OAuth session found")
    
    # Create access token
    access_token = utils.create_access_token(data={"user_id": user_id, "role": user_role})
    
    # Clear the session data after token is issued
    request.session.pop('oauth_user_id', None)
    request.session.pop('oauth_user_role', None)
    
    return {"access_token": access_token, "token_type": "bearer"}
