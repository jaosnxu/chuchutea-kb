from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.knowledge import KnowledgeEntry, KnowledgeModule

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


class KnowledgeCreate(BaseModel):
    module: str
    title_zh: str
    title_ru: str = ""
    content_zh: str
    content_ru: str = ""
    image_url: str = ""


class KnowledgeUpdate(BaseModel):
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
):
    """获取知识列表"""
    stmt = KnowledgeEntry.__table__.select()
    if module:
        stmt = stmt.where(KnowledgeEntry.module == KnowledgeModule(module))
    stmt = stmt.order_by(KnowledgeEntry.updated_at.desc())
    stmt = stmt.offset((page - 1) * size).limit(size)

    result = await db.execute(stmt)
    rows = result.fetchall()
    return {
        "items": [
            {
                "id": row.id,
                "module": row.module.value,
                "title": row.title_zh if lang == "zh" else (row.title_ru or row.title_zh),
                "content": row.content_zh if lang == "zh" else (row.content_ru or row.content_zh),
                "image_url": row.image_url,
                "created_at": row.created_at.isoformat(),
                "updated_at": row.updated_at.isoformat(),
            }
            for row in rows
        ],
        "total": len(rows),
    }


@router.post("/create")
async def create_knowledge(req: KnowledgeCreate, db: AsyncSession = Depends(get_db)):
    """新增知识条目"""
    entry = KnowledgeEntry(
        module=KnowledgeModule(req.module),
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
async def update_knowledge(entry_id: str, req: KnowledgeUpdate, db: AsyncSession = Depends(get_db)):
    """更新知识条目"""
    result = await db.execute(KnowledgeEntry.__table__.select().where(KnowledgeEntry.id == entry_id))
    entry = result.fetchone()
    if not entry:
        raise HTTPException(status_code=404, detail="条目不存在")

    update_data = req.model_dump(exclude_none=True)
    if update_data:
        await db.execute(
            KnowledgeEntry.__table__.update()
            .where(KnowledgeEntry.id == entry_id)
            .values(**update_data)
        )
        await db.commit()

    return {"message": "更新成功"}


@router.delete("/{entry_id}")
async def delete_knowledge(entry_id: str, db: AsyncSession = Depends(get_db)):
    """删除知识条目"""
    result = await db.execute(KnowledgeEntry.__table__.select().where(KnowledgeEntry.id == entry_id))
    if not result.fetchone():
        raise HTTPException(status_code=404, detail="条目不存在")

    await db.execute(
        KnowledgeEntry.__table__.delete().where(KnowledgeEntry.id == entry_id)
    )
    await db.commit()
    return {"message": "删除成功"}
