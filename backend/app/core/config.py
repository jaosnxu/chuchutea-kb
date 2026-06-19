from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://teammind:teammind@localhost:5432/teammind"

    # AI Models
    llm_provider: str = "deepseek"  # deepseek | doubao
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    doubao_api_key: str = ""
    doubao_base_url: str = "https://ark.cn-beijing.volces.com/api/v3"
    doubao_model: str = "doubao-vision-pro-32k"

    app_name: str = "TeaMind"
    debug: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
