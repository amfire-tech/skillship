import os
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
import bcrypt as _bcrypt
from jose import jwt
from config.supabase_client import supabase

JWT_SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRY_MINUTES = 15
REFRESH_TOKEN_EXPIRY_DAYS = 7
MAX_FAILED_ATTEMPTS = 5


def _hash(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt(10)).decode()


def _verify(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


# ─── Login ─────────────────────────────────────────────────────────────────────
async def login(user_id: str, password: str, role: str):
    if not user_id or not password or not role:
        raise HTTPException(status_code=400, detail="user_id, password and role are required")

    # Step 1: Find user by user_id, fall back to email
    response = supabase.from_("user_auth").select("*").eq("user_id", user_id).limit(1).execute()
    users = response.data

    if not users:
        response = supabase.from_("user_auth").select("*").eq("email", user_id).limit(1).execute()
        users = response.data

    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    user = users[0]

    # Step 2: Check if account is locked
    if user.get("is_locked"):
        raise HTTPException(status_code=403, detail="Account is locked. Please contact your administrator.")

    # Step 3: Verify password
    password_match = _verify(password, user["password_hash"])

    if not password_match:
        new_failed_attempts = (user.get("failed_login_attempts") or 0) + 1
        should_lock = new_failed_attempts >= MAX_FAILED_ATTEMPTS

        supabase.from_("user_auth").update({
            "failed_login_attempts": new_failed_attempts,
            "is_locked": should_lock,
        }).eq("user_id", user["user_id"]).execute()

        if should_lock:
            raise HTTPException(status_code=403, detail="Account locked after too many failed attempts.")
        raise HTTPException(
            status_code=401,
            detail=f"Invalid password. Attempts remaining: {MAX_FAILED_ATTEMPTS - new_failed_attempts}"
        )

    # Step 4: Check selected role matches DB role
    if role != user["role"]:
        raise HTTPException(status_code=401, detail="Selected role does not match your account role.")

    # Step 5: Generate tokens
    access_token = jwt.encode(
        {
            "user_id": user["user_id"],
            "role": user["role"],
            "school_id": user.get("school_id"),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES),
        },
        JWT_SECRET,
        algorithm=ALGORITHM,
    )

    refresh_token = secrets.token_hex(64)
    refresh_token_hash = _hash(refresh_token)

    # Step 6: Update last_login_at, reset failed attempts, store refresh token hash
    token_expires_at = (datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)).isoformat()

    supabase.from_("user_auth").update({
        "last_login_at": datetime.now(timezone.utc).isoformat(),
        "failed_login_attempts": 0,
        "refresh_token_hash": refresh_token_hash,
        "token_expires_at": token_expires_at,
    }).eq("user_id", user["user_id"]).execute()

    return {
        "user": {
            "id": user["id"],
            "user_id": user["user_id"],
            "full_name": user.get("full_name"),
            "email": user["email"],
            "role": user["role"],
            "school_id": user.get("school_id"),
        },
        "accessToken": access_token,
        "refreshToken": refresh_token,
    }


# ─── Logout ────────────────────────────────────────────────────────────────────
async def logout(current_user: dict):
    user_id = current_user.get("user_id")
    supabase.from_("user_auth").update({"refresh_token_hash": None}).eq("user_id", user_id).execute()
    return {"message": "Logged out successfully"}


# ─── Refresh ───────────────────────────────────────────────────────────────────
async def refresh(user_id: str, refresh_token: str):
    if not user_id or not refresh_token:
        raise HTTPException(status_code=400, detail="user_id and refreshToken are required")

    response = supabase.from_("user_auth").select("*").eq("user_id", user_id).limit(1).execute()
    users = response.data

    if not users:
        raise HTTPException(status_code=404, detail="User not found")

    user = users[0]

    if not user.get("refresh_token_hash"):
        raise HTTPException(status_code=401, detail="No active session. Please login again.")

    token_match = _verify(refresh_token, user["refresh_token_hash"])

    if not token_match:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_access_token = jwt.encode(
        {
            "user_id": user["user_id"],
            "role": user["role"],
            "school_id": user.get("school_id"),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRY_MINUTES),
        },
        JWT_SECRET,
        algorithm=ALGORITHM,
    )

    return {"accessToken": new_access_token}
