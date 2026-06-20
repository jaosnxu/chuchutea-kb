# 部署指南

## 1. 数据库 → Supabase (免费)
1. https://supabase.com → GitHub 登录 → New project
2. 记下 Database URL
3. 启用 pgvector：SQL Editor 运行 `create extension vector`

## 2. 后端 → Render (免费)
1. https://render.com → GitHub 登录 → New Web Service
2. 连接 chuchutea-kb 仓库
3. Root Directory: backend
4. Build Command: pip install -r requirements.txt
5. Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
6. Environment Variables:
   - DATABASE_URL = Supabase 的连接串+?sslmode=require
   - LLM_PROVIDER = doubao
   - DOUBAO_API_KEY = 你的 Key

## 3. 前端指向后端
拿到 Render 的 URL 后告诉我，我更新 vercel.json

## 4. 大模型 Key
DOUBAO_API_KEY = ark-ca60ffc8-378d-4cb9-a5a7-35345998efbb-5afc9
