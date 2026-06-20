from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import create_token, verify_token
from app.models.knowledge import AVAILABLE_MODULES
from app.models.user import ROLE_MODULES, User

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"
    allowed_modules: list[str] | None = None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(401, "未登录")
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token 无效或已过期")
    return payload


def require_role(*roles: str):
    def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, f"权限不足，需要角色: {', '.join(roles)}")
        return user
    return checker


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """登录，返回 JWT token"""
    result = await db.execute(select(User).where(User.username == req.username))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(401, "用户名或密码错误")
    if not User.verify_password(req.password, user.salt, user.password_hash):
        raise HTTPException(401, "用户名或密码错误")

    token = create_token(user.id, user.username, user.role, user.allowed_modules)
    return {"token": token, "username": user.username, "role": user.role, "allowed_modules": user.allowed_modules}


@router.post("/register")
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_role("admin")),
):
    if req.role not in ("viewer", "editor", "admin"):
        raise HTTPException(400, "无效角色，可选: viewer / editor / admin")
    allowed_modules = req.allowed_modules if req.allowed_modules is not None else ROLE_MODULES[req.role]
    invalid_modules = [module for module in allowed_modules if module not in AVAILABLE_MODULES]
    if invalid_modules:
        raise HTTPException(400, f"无效模块: {', '.join(invalid_modules)}")

    existing = await db.execute(select(User).where(User.username == req.username))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "用户名已存在")

    pw_hash, salt = User.hash_password(req.password)
    user = User(username=req.username, password_hash=pw_hash, salt=salt, role=req.role, allowed_modules=allowed_modules)
    db.add(user)
    await db.commit()
    return {"id": user.id, "username": user.username, "role": user.role, "message": "注册成功"}


@router.get("/me")
async def me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(401, "未登录")
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token 无效或已过期")
    return {"username": payload["username"], "role": payload["role"], "allowed_modules": payload.get("allowed_modules", [])}
