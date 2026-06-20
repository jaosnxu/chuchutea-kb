from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from app.core.config import settings


def async_database_url(url: str) -> str:
    parts = urlsplit(url)
    query_items: list[tuple[str, str]] = []
    ssl_required = False
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "channel_binding":
            continue
        if key == "sslmode":
            ssl_required = value in {"require", "verify-ca", "verify-full"}
            continue
        query_items.append((key, value))
    if ssl_required:
        query_items.append(("ssl", "require"))
    query = urlencode(query_items)
    url = urlunsplit((parts.scheme, parts.netloc, parts.path, query, parts.fragment))
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(async_database_url(settings.database_url), echo=settings.debug)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
