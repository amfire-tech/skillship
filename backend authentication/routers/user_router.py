from fastapi import APIRouter, Depends
from controllers.user_controller import create_user
from middleware.auth_middleware import require_super_admin

router = APIRouter(prefix="/api/users")


@router.post("")
async def create_user_route(body: dict, current_user: dict = Depends(require_super_admin)):
    return await create_user(body, current_user)
