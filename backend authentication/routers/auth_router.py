from fastapi import APIRouter, Depends
from pydantic import BaseModel
from controllers.auth_controller import login, logout, refresh
from middleware.auth_middleware import authenticate

router = APIRouter(prefix="/api/auth")


class LoginBody(BaseModel):
    user_id: str
    password: str
    role: str


class RefreshBody(BaseModel):
    user_id: str
    refreshToken: str


@router.post("/login")
async def login_route(body: LoginBody):
    return await login(body.user_id, body.password, body.role)


@router.post("/logout")
async def logout_route(current_user: dict = Depends(authenticate)):
    return await logout(current_user)


@router.post("/refresh")
async def refresh_route(body: RefreshBody):
    return await refresh(body.user_id, body.refreshToken)
