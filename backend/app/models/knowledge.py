import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from app.core.database import Base


class KnowledgeModule(str, enum.Enum):
    PRODUCT = "product"
    SOP = "sop"
    TRAINING = "training"
    STORE = "store"
    MARKETING = "marketing"


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module: Mapped[KnowledgeModule] = mapped_column(SAEnum(KnowledgeModule), index=True, nullable=False)
    title_zh: Mapped[str] = mapped_column(String(500), nullable=False)
    title_ru: Mapped[str] = mapped_column(String(500), default="")
    content_zh: Mapped[str] = mapped_column(Text, nullable=False)
    content_ru: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(1000), default="")
    embedding: Mapped[list[float]] = mapped_column(Vector(1536), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by: Mapped[str] = mapped_column(String(100), default="")
    version: Mapped[int] = mapped_column(default=1)
    is_published: Mapped[bool] = mapped_column(default=True)
