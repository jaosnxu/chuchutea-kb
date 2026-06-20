from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://teammind:teammind@localhost:5432/teammind"

    # AI Models - 双模型架构
    # 文字对话 → DeepSeek（快、便宜）
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_chat_model: str = "deepseek-chat"

    # 图片理解 → 豆包 Vision
    doubao_api_key: str = ""
    doubao_base_url: str = "https://ark.cn-beijing.volces.com/api/v3"
    doubao_vision_model: str = "doubao-seed-1-6-251015"
    doubao_embedding_model: str = "doubao-embedding-vision-251215"

    # 当前文字模型选择
    text_model: str = "doubao"  # doubao | deepseek

    app_name: str = "CHUCHUTEA"
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
