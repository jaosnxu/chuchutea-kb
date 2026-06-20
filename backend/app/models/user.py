import uuid
import hashlib
import secrets
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

# 默认模块权限
ROLE_MODULES = {
    "viewer": ["product", "sop", "training"],  # 一线员工：产品、SOP、培训
    "editor": ["product", "sop", "training", "store", "marketing", "brand", "franchise", "operations", "equipment", "maintenance"],
    "admin": ["product", "sop", "training", "store", "marketing", "brand", "franchise", "operations", "equipment", "maintenance"],
}


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    salt: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="viewer")  # viewer | editor | admin
    allowed_modules: Mapped[list] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    @staticmethod
    def hash_password(password: str, salt: str = "") -> tuple[str, str]:
        if not salt:
            salt = secrets.token_hex(16)
        h = hashlib.sha256(f"{salt}:{password}".encode()).hexdigest()
        return h, salt

    @staticmethod
    def verify_password(password: str, salt: str, password_hash: str) -> bool:
        h, _ = User.hash_password(password, salt)
        return h == password_hash


def create_default_admin(db_session):
    """创建默认管理员账号"""
    from app.core.database import async_session
    import asyncio

    async def _create():
        async with async_session() as db:
            from sqlalchemy import select
            result = await db.execute(select(User).where(User.username == "admin"))
            if not result.scalar_one_or_none():
                pw_hash, salt = User.hash_password("admin123")
                admin = User(username="admin", password_hash=pw_hash, salt=salt, role="admin", allowed_modules=ROLE_MODULES["admin"])
                db.add(admin)
                await db.commit()
                print("默认管理员已创建: admin / admin123")

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(_create())
        else:
            loop.run_until_complete(_create())
    except:
        pass
