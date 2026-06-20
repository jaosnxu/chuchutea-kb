from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from typing import Optional
from pydantic import BaseModel
from app.api.auth_routes import get_current_user, require_role
from app.core.database import get_db
from app.models.knowledge import KnowledgeEntry, AVAILABLE_MODULES

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


class KnowledgeCreate(BaseModel):
    module: str
    title_zh: str
    title_ru: str = ""
    content_zh: str
    content_ru: str = ""
    image_url: str = ""


class KnowledgeUpdate(BaseModel):
    module: Optional[str] = None
    title_zh: Optional[str] = None
    title_ru: Optional[str] = None
    content_zh: Optional[str] = None
    content_ru: Optional[str] = None
    image_url: Optional[str] = None
    is_published: Optional[bool] = None


@router.get("/list")
async def list_knowledge(
    module: Optional[str] = None,
    lang: str = "zh",
    page: int = 1,
    size: int = 20,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if page < 1 or size < 1 or size > 100:
        raise HTTPException(400, "分页参数无效")
    allowed_modules = user.get("allowed_modules") or AVAILABLE_MODULES
    if module and module not in allowed_modules:
        raise HTTPException(403, "无权访问该模块")

    stmt = select(KnowledgeEntry)
    count_stmt = select(func.count()).select_from(KnowledgeEntry)
    if not module:
        stmt = stmt.where(KnowledgeEntry.module.in_(allowed_modules))
        count_stmt = count_stmt.where(KnowledgeEntry.module.in_(allowed_modules))
    if module:
        stmt = stmt.where(KnowledgeEntry.module == module)
        count_stmt = count_stmt.where(KnowledgeEntry.module == module)
    stmt = stmt.order_by(KnowledgeEntry.updated_at.desc())
    stmt = stmt.offset((page - 1) * size).limit(size)

    result = await db.execute(stmt)
    rows = result.scalars().all()
    total = await db.scalar(count_stmt)
    return {
        "items": [
            {
                "id": row.id,
                "module": row.module,
                "title": row.title_zh if lang == "zh" else (row.title_ru or row.title_zh),
                "content": row.content_zh if lang == "zh" else (row.content_ru or row.content_zh),
                "title_zh": row.title_zh,
                "title_ru": row.title_ru,
                "content_zh": row.content_zh,
                "content_ru": row.content_ru,
                "image_url": row.image_url,
                "is_published": row.is_published,
                "created_at": row.created_at.isoformat(),
                "updated_at": row.updated_at.isoformat(),
            }
            for row in rows
        ],
        "total": total or 0,
    }


@router.post("/create")
async def create_knowledge(
    req: KnowledgeCreate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_role("editor", "admin")),
):
    if req.module not in AVAILABLE_MODULES:
        raise HTTPException(400, "无效模块")
    entry = KnowledgeEntry(
        module=req.module,
        title_zh=req.title_zh,
        title_ru=req.title_ru,
        content_zh=req.content_zh,
        content_ru=req.content_ru,
        image_url=req.image_url,
    )
    db.add(entry)
    await db.commit()
    return {"id": entry.id, "message": "创建成功"}


@router.put("/{entry_id}")
async def update_knowledge(
    entry_id: str,
    req: KnowledgeUpdate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_role("editor", "admin")),
):
    result = await db.execute(select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="条目不存在")

    update_data = req.model_dump(exclude_none=True)
    if "module" in update_data and update_data["module"] not in AVAILABLE_MODULES:
        raise HTTPException(400, "无效模块")
    if update_data:
        for key, value in update_data.items():
            setattr(entry, key, value)
        await db.commit()

    return {"message": "更新成功"}


@router.delete("/{entry_id}")
async def delete_knowledge(
    entry_id: str,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_role("editor", "admin")),
):
    result = await db.execute(select(KnowledgeEntry).where(KnowledgeEntry.id == entry_id))
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="条目不存在")

    await db.delete(entry)
    await db.commit()
    return {"message": "删除成功"}
