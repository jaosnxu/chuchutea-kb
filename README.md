# TeaMind — 奶茶连锁店 AI 知识库

## 技术栈
- **前端**：React + TypeScript + Vite
- **后端**：Python + FastAPI
- **数据库**：PostgreSQL + pgvector
- **大模型**：豆包 / DeepSeek（国产模型）
- **部署**：Vercel Services + Neon Free，本地可用 Docker Compose

## 目录结构
```
teammind/
├── backend/                  # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py              # 应用入口
│   │   ├── api/
│   │   │   ├── chat.py          # /api/chat/ask — RAG 问答
│   │   │   └── knowledge.py     # /api/knowledge — 知识库 CRUD
│   │   ├── core/
│   │   │   ├── config.py        # 配置（数据库、大模型）
│   │   │   └── database.py      # 异步数据库连接
│   │   ├── models/
│   │   │   └── knowledge.py     # 知识库数据模型
│   │   └── services/
│   │       └── rag_service.py   # RAG 检索 + LLM 问答
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React + TypeScript 前端
│   ├── src/
│   │   ├── main.tsx
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml        # 本地 PostgreSQL + pgvector
└── DESIGN.md                 # 前端设计基线
```

## 快速启动

### 1. 启动数据库
```bash
docker-compose up -d
```

### 2. 后端
```bash
cd backend
cp .env.example .env   # 填入 API Key、SECRET_KEY、CORS_ORIGINS
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. 前端
```bash
cd frontend
npm install
npm run dev
```

打开 http://localhost:3000

## API 接口

| 接口 | 说明 |
|------|------|
| `POST /api/chat/ask` | RAG 问答（支持中俄双语） |
| `GET /api/knowledge/list` | 知识列表（按模块筛选） |
| `POST /api/knowledge/create` | 新增知识条目 |
| `PUT /api/knowledge/:id` | 更新知识条目 |
| `DELETE /api/knowledge/:id` | 删除知识条目 |

除 `/api/auth/login` 外，业务接口都需要 `Authorization: Bearer <token>`。
