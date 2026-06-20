from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel
import json
from app.core.database import get_db
from app.services.rag_service import answer_question, search_knowledge, call_llm_stream, call_llm

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    query: str
    lang: str = "zh"
    module: Optional[str] = None
    history: Optional[list] = []


@router.post("/ask")
async def ask(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """RAG 问答接口（普通模式）"""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="查询内容不能为空")

    result = await answer_question(
        db=db, query=req.query, lang=req.lang, module=req.module, history=req.history,
    )
    return result


@router.post("/ask/stream")
async def ask_stream(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """RAG 问答接口（流式输出）"""
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="查询内容不能为空")

    # 1. 搜索知识库
    knowledge_results = await search_knowledge(db, req.query, req.lang, req.module)

    # 2. 构建上下文（历史对话 + 知识库）
    context_messages = []
    
    # 加入历史对话上下文（最近3轮）
    if req.history:
        for h in req.history[-6:]:  # 最多3轮(6条消息)
            context_messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    # 当前问题
    context_messages.append({"role": "user", "content": req.query})

    # 知识库命中 → 直接返回原文，不走LLM
    if knowledge_results:
        best = knowledge_results[0]
        async def stream_kb():
            # 先发送元数据
            yield f"data: {json.dumps({'type': 'meta', 'source': 'knowledge_base', 'references': [{'title': r['title'], 'module': r['module'], 'id': r['id']} for r in knowledge_results], 'images': [r['image_url'] for r in knowledge_results if r.get('image_url')]})}\n\n"
            # 逐字流式输出
            content = best["content"]
            for i in range(0, len(content), 3):
                yield f"data: {json.dumps({'type': 'text', 'text': content[i:i+3]})}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(stream_kb(), media_type="text/event-stream")

    # 知识库没命中 → LLM流式降级
    system_prompt = (
        f"你是 CHUCHUTEA 奶茶连锁品牌的 AI 知识助手。CHUCHUTEA 在俄罗斯大诺夫哥罗德、普斯科夫、特维尔运营。"
        f"知识库中未找到相关内容，请根据常识回答并提示仅供参考。"
        f"回答语言：{'中文' if req.lang == 'zh' else '俄语'}。"
    )

    async def stream_llm():
        # 先发送元数据
        yield f"data: {json.dumps({'type': 'meta', 'source': 'llm_fallback', 'references': []})}\n\n"
        # 流式调用LLM
        async for chunk in call_llm_stream(context_messages, system_prompt):
            yield f"data: {json.dumps({'type': 'text', 'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream_llm(), media_type="text/event-stream")
