"""
快速测试豆包对话模型，无需数据库
"""
import asyncio
import httpx
import json

API_KEY = "ark-ca60ffc8-378d-4cb9-a5a7-35345998efbb-5afc9"
BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
MODEL = "doubao-seed-1-6-251015"


async def test_chat():
    """纯文字对话"""
    print("=== 测试 1: 中文对话 ===")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={
                "model": MODEL,
                "messages": [
                    {"role": "user", "content": "你好，介绍一下奶茶店的草莓多多产品"}
                ],
                "max_tokens": 100,
            },
        )
        data = resp.json()
        print(data["choices"][0]["message"]["content"])
        print(f"  tokens: {data.get('usage', {})}")
        print()


async def test_rag_style():
    """模拟 RAG 对话：带知识库上下文"""
    print("=== 测试 2: RAG 风格——知识优先 ===")
    knowledge = """
[产品] 草莓多多 - 中杯 500mL ¥18 / 大杯 700mL ¥22
成分：草莓果酱、鲜牛奶、茉莉绿茶、脆波波
制作：①草莓果酱40g打底 → ②脆波波30g → ③冰块8分满 → ④茉莉绿茶200mL → ⑤鲜牛奶至满杯
"""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={
                "model": MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": f"你是奶茶店AI助手。严格基于以下知识库回答：\n{knowledge}"
                    },
                    {"role": "user", "content": "草莓多多多少钱？"},
                ],
                "max_tokens": 80,
            },
        )
        data = resp.json()
        print(data["choices"][0]["message"]["content"])
        print()


async def test_image():
    """图片理解"""
    print("=== 测试 3: 图片理解 ===")
    import struct, zlib

    def create_png(w, h, color):
        raw = b""
        for y in range(h):
            raw += b"\x00"
            for x in range(w):
                raw += bytes(color)

        def chunk(ctype, data):
            c = ctype + data
            crc = struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
            return struct.pack(">I", len(data)) + c + crc

        ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
        compressed = zlib.compress(raw)
        return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")

    import base64
    png = create_png(50, 50, [255, 0, 0, 255])  # 红色图片
    b64 = base64.b64encode(png).decode()

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={
                "model": MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": "这是什么颜色？中文回答"},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                        ],
                    }
                ],
                "max_tokens": 10,
            },
        )
        data = resp.json()
        print(data["choices"][0]["message"]["content"])
        print()


async def test_russian():
    """俄语对话"""
    print("=== 测试 4: 俄语对话 ===")
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {API_KEY}"},
            json={
                "model": MODEL,
                "messages": [
                    {"role": "user", "content": "Привет! Расскажи о чайном напитке."}
                ],
                "max_tokens": 80,
            },
        )
        data = resp.json()
        print(data["choices"][0]["message"]["content"])
        print()


if __name__ == "__main__":
    asyncio.run(test_chat())
    asyncio.run(test_rag_style())
    asyncio.run(test_image())
    asyncio.run(test_russian())
    print("✅ 全部测试完成！")
