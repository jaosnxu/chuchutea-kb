from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://teammind:teammind@localhost:5432/teammind"

    # AI Models - Chat（对话生成）
    llm_provider: str = "deepseek"
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_chat_model: str = "deepseek-chat"

    doubao_api_key: str = ""
    doubao_base_url: str = "https://ark.cn-beijing.volces.com/api/v3"
    doubao_chat_model: str = "doubao-vision-pro-32k"       # 对话+图片理解
    doubao_embedding_model: str = "doubao-embedding-vision-251215"  # 向量嵌入+图片

    app_name: str = "TeaMind"
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
