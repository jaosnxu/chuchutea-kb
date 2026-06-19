from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.services.rag_service import answer_question

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    query: str
    lang: str = "zh"  # zh | ru
    module: str | None = None  # product | sop | training | store | marketing
    history: list[dict] | None = []  # 多轮对话上下文


@router.post("/ask")
async def ask(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """RAG 问答接口"""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="查询内容不能为空")

    result = await answer_question(
        db=db,
        query=req.query,
        lang=req.lang,
        module=req.module,
        history=req.history,
    )
    return result
