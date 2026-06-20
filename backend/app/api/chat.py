from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel
import json, time
from app.core.database import get_db
from app.services.rag_service import answer_question, search_knowledge, call_llm_stream, call_llm

router = APIRouter(prefix="/api/chat", tags=["chat"])

_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 300

class ChatRequest(BaseModel):
    query: str
    lang: str = "zh"
    module: Optional[str] = None
    history: Optional[list] = []

@router.post("/ask")
async def ask(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    if not req.query.strip():
        raise HTTPException(400, "查询内容不能为空")
    cache_key = f"{req.query}:{req.lang}"
    if cache_key in _cache:
        ts, result = _cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return result
    result = await answer_question(db, req.query, req.lang, req.module, req.history)
    _cache[cache_key] = (time.time(), result)
    return result

@router.post("/ask/stream")
async def ask_stream(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    if not req.query.strip():
        raise HTTPException(400, "查询内容不能为空")

    knowledge_results = await search_knowledge(db, req.query, req.lang, req.module)

    # 上下文压缩：最多10条消息
    history = req.history[-10:] if req.history else []
    ctx = [{"role": h.get("role","user"), "content": h.get("content","")} for h in history]
    ctx.append({"role": "user", "content": req.query})

    if knowledge_results:
        best = knowledge_results[0]
        async def stream_kb():
            yield f"data: {json.dumps({'type':'meta','source':'knowledge_base','references':[{'title':r['title'],'module':r['module'],'id':r['id']} for r in knowledge_results],'images':[r['image_url'] for r in knowledge_results if r.get('image_url')]})}\n\n"
            content = best["content"]
            for i in range(0, len(content), 3):
                yield f"data: {json.dumps({'type':'text','text':content[i:i+3]})}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(stream_kb(), media_type="text/event-stream")

    sp = (
        f"你是 CHUCHUTEA 奶茶连锁品牌的 AI 知识助手。CHUCHUTEA 在俄罗斯大诺夫哥罗德、普斯科夫、特维尔运营。"
        f"知识库中未找到相关内容，请根据常识回答并提示仅供参考。"
        f"回答语言：{'中文' if req.lang == 'zh' else '俄语'}。"
    )
    async def stream_llm():
        yield f"data: {json.dumps({'type':'meta','source':'llm_fallback','references':[]})}\n\n"
        async for chunk in call_llm_stream(ctx, sp):
            yield f"data: {json.dumps({'type':'text','text':chunk})}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(stream_llm(), media_type="text/event-stream")
