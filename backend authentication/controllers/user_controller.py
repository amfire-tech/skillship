import re
import bcrypt as _bcrypt
from fastapi import HTTPException
from config.supabase_client import supabase


def _hash(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt(10)).decode()


# ─── User ID Generator ─────────────────────────────────────────────────────────
async def generate_user_id(role: str, school: str = None, class_grade: str = None) -> str:
    if role == "subadmin":
        prefix = "SA"
    elif role == "teacher":
        prefix = "TA"
    elif role == "principal":
        letter = (school or "X").strip()[0].upper()
        prefix = f"P{letter}"
    elif role == "student":
        letter = (school or "X").strip()[0].upper()
        clean_class = re.sub(r"class\s*", "", class_grade or "", flags=re.IGNORECASE)
        clean_class = re.sub(r"[\s\-]", "", clean_class).upper()
        prefix = f"S{letter}{clean_class}"
    else:
        prefix = "USR"

    response = supabase.from_("user_auth").select("*", count="exact").like("user_id", f"{prefix}%").execute()
    count = response.count or 0
    serial = str(count + 1).zfill(3)
    return f"{prefix}{serial}"


# ─── Create User ───────────────────────────────────────────────────────────────
async def create_user(body: dict, current_user: dict):
    role = body.get("role")
    full_name = body.get("full_name")
    email = body.get("email")
    phone = body.get("phone")
    password = body.get("password")
    school = body.get("school")
    class_grade = body.get("class_grade")

    if not role or not full_name or not email or not phone or not password:
        raise HTTPException(status_code=400, detail="Missing required fields")

    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    role_labels = {
        "subadmin": "Sub Admin",
        "teacher": "Teacher",
        "principal": "Principal",
        "student": "Student",
    }
    role_label = role_labels.get(role, role)

    if role not in role_labels:
        raise HTTPException(status_code=400, detail="Invalid role")

    user_id = await generate_user_id(role, school, class_grade)
    password_hash = _hash(password)

    auth_res = supabase.from_("user_auth").insert({
        "user_id": user_id,
        "full_name": full_name,
        "email": email,
        "phone": phone,
        "password_hash": password_hash,
        "role": role_label,
        "is_locked": False,
        "failed_login_attempts": 0,
    }).execute()

    if not auth_res.data:
        raise HTTPException(status_code=500, detail="Failed to create user")

    return {
        "message": "User created successfully",
        "user_id": user_id,
        "full_name": full_name,
        "role": role_label,
    }
