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

## 4. 环境变量
在 Vercel 项目环境变量里配置：

```text
DATABASE_URL
TEXT_MODEL
DOUBAO_API_KEY
DOUBAO_BASE_URL
DOUBAO_VISION_MODEL
DOUBAO_EMBEDDING_MODEL
SECRET_KEY
CORS_ORIGINS
ALLOW_DEFAULT_ADMIN=false
```

不要把 API Key、数据库地址、`SECRET_KEY` 写入仓库。

## 5. 管理员账号
系统不再自动创建 `admin / admin123`。需要初始化账号时，使用受控脚本或临时打开 `ALLOW_DEFAULT_ADMIN=true` 并配置强密码 `DEFAULT_ADMIN_PASSWORD`，完成后立即关闭。
