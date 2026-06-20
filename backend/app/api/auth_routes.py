from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.core.auth import create_token, verify_token
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"


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
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """注册新用户（仅 admin 可操作）"""
    if req.role not in ("viewer", "editor", "admin"):
        raise HTTPException(400, "无效角色，可选: viewer / editor / admin")

    existing = await db.execute(select(User).where(User.username == req.username))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "用户名已存在")

    pw_hash, salt = User.hash_password(req.password)
    user = User(username=req.username, password_hash=pw_hash, salt=salt, role=req.role)
    db.add(user)
    await db.commit()
    return {"id": user.id, "username": user.username, "role": user.role, "message": "注册成功"}


@router.get("/me")
async def me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """获取当前用户信息"""
    if not credentials:
        raise HTTPException(401, "未登录")
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token 无效或已过期")
    return {"username": payload["username"], "role": payload["role"]}


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """依赖注入：获取当前用户，用于保护路由"""
    if not credentials:
        raise HTTPException(401, "未登录")
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(401, "Token 无效或已过期")
    return payload


def require_role(*roles: str):
    """角色权限检查"""
    def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(403, f"权限不足，需要角色: {', '.join(roles)}")
        return user
    return checker
