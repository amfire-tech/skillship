import os
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

bearer_scheme = HTTPBearer()


def authenticate(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_super_admin(credentials: HTTPAuthorizationCredentials = Security(bearer_scheme)):
    payload = authenticate(credentials)
    if payload.get("role") != "Super Admin":
        raise HTTPException(status_code=403, detail="Access denied. Super Admin only.")
    return payload
