import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from app.core.database import Base

# 模块列表：纯字符串，随时加，不用改数据库
# 当前模块：产品、SOP、培训、门店、营销、品牌、特许、运营、设备、维修
AVAILABLE_MODULES = [
    "product",      # 产品库
    "sop",          # 操作 SOP
    "training",     # 培训资料 / 话术
    "store",        # 门店信息
    "marketing",    # 营销活动
    "brand",        # 品牌
    "franchise",    # 特许经营
    "operations",   # 运营管理
    "equipment",    # 设备
    "maintenance",  # 维修
]


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    title_zh: Mapped[str] = mapped_column(String(500), nullable=False)
    title_ru: Mapped[str] = mapped_column(String(500), default="")
    content_zh: Mapped[str] = mapped_column(Text, nullable=False)
    content_ru: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(1000), default="")
    embedding: Mapped[list[float]] = mapped_column(Vector(1536), nullable=True)
    keywords: Mapped[str] = mapped_column(Text, default='')
    summary: Mapped[str] = mapped_column(Text, default='')

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by: Mapped[str] = mapped_column(String(100), default="")
    version: Mapped[int] = mapped_column(default=1)
    is_published: Mapped[bool] = mapped_column(default=True)
