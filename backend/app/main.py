from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api import chat, knowledge, import_doc, conversations, auth_routes
from app.models.user import create_default_admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    create_default_admin(None)
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(knowledge.router)
app.include_router(import_doc.router)
app.include_router(conversations.router)
app.include_router(auth_routes.router)


@app.get("/")
async def root():
    return {"app": settings.app_name, "version": "0.1.0", "status": "running"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
