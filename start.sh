#!/bin/bash
# CHUCHUTEA 一键启动脚本

echo "🚀 启动 CHUCHUTEA 知识库..."

# 1. 启动数据库
echo "📦 启动 PostgreSQL..."
colima start 2>/dev/null
cd "$(dirname "$0")"
docker-compose up -d

# 2. 启动后端
echo "🔧 启动后端..."
cd backend
/usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
sleep 3

# 3. 启动前端
echo "🎨 启动前端..."
cd ../frontend
npx vite --port 3000 --host &
sleep 2

# 4. 启动 ngrok
echo "🌐 启动外网..."
ngrok http 8000 --log=stdout &

echo ""
echo "================================="
echo "✅ 全部启动完成"
echo "本地访问: http://localhost:3000"
echo "后端API:  http://localhost:8000"
echo "================================="
