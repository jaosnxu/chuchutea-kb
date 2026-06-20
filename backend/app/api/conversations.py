from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.core.database import get_db
from app.models.conversation import Conversation

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


class SaveRequest(BaseModel):
    title: str = "新对话"
    lang: str = "zh"
    messages: list[dict] = []
    pinned: bool = False


class UpdateRequest(BaseModel):
    title: Optional[str] = None
    pinned: Optional[bool] = None


@router.get("/list")
async def list_convs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).order_by(Conversation.pinned.desc(), Conversation.updated_at.desc()).limit(50)
    )
    convs = result.scalars().all()
    return [
        {"id": c.id, "title": c.title, "lang": c.lang, "pinned": c.pinned, "updated_at": c.updated_at.isoformat()}
        for c in convs
    ]


@router.post("/save")
async def save_conv(req: SaveRequest, db: AsyncSession = Depends(get_db)):
    conv = Conversation(title=req.title, lang=req.lang, messages=req.messages, pinned=req.pinned)
    db.add(conv)
    await db.commit()
    return {"id": conv.id, "message": "已保存"}


@router.put("/{conv_id}")
async def update_conv(conv_id: str, req: UpdateRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "对话不存在")
    if req.title is not None:
        conv.title = req.title
    if req.pinned is not None:
        conv.pinned = req.pinned
    from datetime import datetime as dt
    conv.updated_at = dt.utcnow()
    await db.commit()
    return {"message": "已更新"}


@router.put("/{conv_id}/full")
async def update_conv_full(conv_id: str, req: SaveRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "对话不存在")
    conv.title = req.title
    conv.lang = req.lang
    conv.messages = req.messages
    conv.pinned = req.pinned
    from datetime import datetime as dt
    conv.updated_at = dt.utcnow()
    await db.commit()
    return {"message": "已更新"}


@router.get("/{conv_id}")
async def get_conv(conv_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "对话不存在")
    return {"id": conv.id, "title": conv.title, "lang": conv.lang, "messages": conv.messages, "pinned": conv.pinned}


@router.delete("/{conv_id}")
async def delete_conv(conv_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(404, "对话不存在")
    await db.delete(conv)
    await db.commit()
    return {"message": "已删除"}
