from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from shared.db.connections import get_db
from services.auth import models, schemas
import requests

# Secret for demo; replace with env var in production
SECRET_KEY = "replace-this-with-secure-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_password_hash(password: str) -> str:
    # bcrypt returns bytes; decode to store as string
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False

def create_access_token(*, data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    user = db.query(models.User).filter(models.User.id == int(payload["user_id"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

import os
import secrets
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as grequests

def create_or_get_user_from_google(id_token_str: str, db: Session):
    """
    Verify Google ID token, create user if not exists, return models.User
    """
    try:
        # Optional audience check using GOOGLE_CLIENT_ID env var
        audience = os.getenv("GOOGLE_CLIENT_ID", None)
        idinfo = google_id_token.verify_oauth2_token(id_token_str, grequests.Request(), audience)
    except ValueError as e:
        msg = f"Invalid Google token: {str(e)}"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)

    email = idinfo.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token missing email")

    # Try find existing user
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return user

    # Create user if not exists
    random_pw = secrets.token_urlsafe(16)
    hashed_pw = get_password_hash(random_pw)
    user = models.User(
        email=email,
        full_name=idinfo.get("name"),
        phone=None,
        address=None,
        hashed_password=hashed_pw,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def exchange_auth_code_for_id_token(auth_code: str, code_verifier: str | None = None) -> str:
    """
    Exchange Google auth code for id_token.
    For GIS popup flow we MUST use redirect_uri = "postmessage".
    Accepts optional PKCE code_verifier if provided, but does not require it.
    """
    token_url = "https://oauth2.googleapis.com/token"

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    if not client_id:
        raise RuntimeError("GOOGLE_CLIENT_ID must be set in the environment")

    # Force GIS popup behavior
    redirect_uri = "postmessage"

    data = {
        "code": auth_code,
        "client_id": client_id,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri,
    }

    if client_secret:
        data["client_secret"] = client_secret

    # include code_verifier only if provided (optional)
    if code_verifier:
        data["code_verifier"] = code_verifier

    resp = requests.post(token_url, data=data, timeout=10)
    if resp.status_code != 200:
        # surface Google's error payload for easier debugging
        raise HTTPException(
            status_code=400,
            detail=f"Google token exchange failed: {resp.status_code} {resp.text}",
        )

    id_token = resp.json().get("id_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="No id_token returned by Google")

    return id_token
