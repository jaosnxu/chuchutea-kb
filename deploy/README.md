# 部署指南

## 1. 数据库 → Neon Free
通过 Vercel Marketplace 创建 Neon Free 资源，并启用 pgvector：

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 2. 后端 → Vercel Services
Vercel 项目 `teammind` 运行 `backend/app/main.py`，API 路径为：

```text
https://teammind-ecru.vercel.app/_/backend/api/health
```

## 3. 前端指向后端
`frontend/vercel.json` 将 `/api/*` rewrite 到 Vercel 后端服务。

## 4. 大模型 Key
在 Vercel 项目环境变量里配置 `DOUBAO_API_KEY`，不要写入仓库。
