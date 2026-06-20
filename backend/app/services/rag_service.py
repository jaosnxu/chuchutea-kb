from typing import Optional
import httpx
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models.knowledge import KnowledgeEntry, KnowledgeModule


async def search_knowledge(db: AsyncSession, query: str, lang: str, module: Optional[str] = None) -> list[dict]:
    """
    知识优先检索：用 SQL 关键词搜索知识库。
    把查询拆成词，搜索 title 和 content 中包含任一关键词的条目。
    """
    from sqlalchemy import or_, and_

    # 拆分查询为关键词（简单按空格和常见标点分）
    keywords = []
    if any('一' <= c <= '鿿' for c in query):
        chinese_chars = ''.join(c for c in query if '一' <= c <= '鿿' or c.isalpha())
        keywords = [chinese_chars[i:i+2] for i in range(len(chinese_chars)-1)]
    else:
        keywords = [k.strip() for k in query.split() if len(k.strip()) >= 2]

    if not keywords:
        keywords = [query]

    conditions = []
    title_col = KnowledgeEntry.title_zh if lang == "zh" else KnowledgeEntry.title_ru
    content_col = KnowledgeEntry.content_zh if lang == "zh" else KnowledgeEntry.content_ru

    for kw in keywords:
        conditions.append(title_col.ilike(f"%{kw}%"))
        conditions.append(content_col.ilike(f"%{kw}%"))

    stmt = select(KnowledgeEntry).where(
        KnowledgeEntry.is_published == True,
        or_(*conditions)
    )

    if module:
        stmt = stmt.where(KnowledgeEntry.module == KnowledgeModule(module))

    stmt = stmt.limit(5)
    result = await db.execute(stmt)
    entries = result.scalars().all()

    return [
        {
            "id": e.id,
            "module": e.module.value,
            "title": e.title_zh if lang == "zh" else (e.title_ru or e.title_zh),
            "content": e.content_zh if lang == "zh" else (e.content_ru or e.content_zh),
            "image_url": e.image_url,
            "source": f"{e.module.value} - {e.title_zh} v{e.version}",
        }
        for e in entries
    ]


async def call_llm(messages: list[dict], system_prompt: str = "") -> str:
    """
    调用大模型（支持豆包和 DeepSeek），
    统一通过 OpenAI 兼容接口。
    """
    if settings.llm_provider == "doubao":
        api_key = settings.doubao_api_key
        base_url = settings.doubao_base_url
        model = settings.doubao_chat_model
    else:
        api_key = settings.deepseek_api_key
        base_url = settings.deepseek_base_url
        model = settings.deepseek_chat_model

    full_messages = []
    if system_prompt:
        full_messages.append({"role": "system", "content": system_prompt})
    full_messages.extend(messages)

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{base_url}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "messages": full_messages,
                "temperature": 0.3,
                "max_tokens": 2000,
            },
        )
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def create_embedding(text: str) -> list[float]:
    """
    调用豆包嵌入模型生成向量，用于知识库存储和检索。
    """
    api_key = settings.doubao_api_key
    base_url = settings.doubao_base_url
    model = settings.doubao_embedding_model

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{base_url}/embeddings",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model,
                "input": text,
            },
        )
        data = resp.json()
        return data["data"][0]["embedding"]


async def answer_question(
    db: AsyncSession, query: str, lang: str, module: Optional[str] = None, history: Optional[list] = None
) -> dict:
    """
    RAG 问答主流程：
    1. 检索知识库
    2. 如果有匹配 → 用知识库内容 + LLM 生成回答
    3. 如果没有匹配 → 用 LLM 自由回答
    """
    knowledge_results = await search_knowledge(db, query, lang, module)

    if knowledge_results:
        # 知识库有匹配 → 知识优先
        context_parts = []
        for i, item in enumerate(knowledge_results, 1):
            context_parts.append(f"[{i}] {item['content']}")

        context = "\n\n".join(context_parts)

        system_prompt = (
            f"你是奶茶连锁店的 AI 知识助手。请严格基于以下知识库内容回答问题，"
            f"不要编造知识库中没有的信息。回答语言：{'中文' if lang == 'zh' else '俄语'}。\n\n"
            f"知识库内容：\n{context}"
        )

        messages = [{"role": "user", "content": query}]
        answer = await call_llm(messages, system_prompt)

        return {
            "answer": answer,
            "source": "knowledge_base",
            "references": [
                {"title": r["title"], "module": r["module"], "id": r["id"]}
                for r in knowledge_results
            ],
            "knowledge_count": len(knowledge_results),
            "images": [r["image_url"] for r in knowledge_results if r.get("image_url")],
        }
    else:
        # 知识库无匹配 → 降级为自由对话
        system_prompt = (
            f"你是奶茶连锁店的 AI 知识助手。注意：你当前的知识库中没有找到与用户问题直接相关的条目，"
            f"请根据你的常识回答，并提示用户仅供参考。回答语言：{'中文' if lang == 'zh' else '俄语'}。"
        )
        messages = [{"role": "user", "content": query}]
        answer = await call_llm(messages, system_prompt)

        return {
            "answer": answer,
            "source": "llm_fallback",
            "references": [],
            "knowledge_count": 0,
            "images": [],
        }
