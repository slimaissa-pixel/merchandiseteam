import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore",
    )

    PROJECT_NAME: str = "Merchandising App"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    APP_URL: str = os.getenv("APP_URL", "http://localhost:8081")

    # Email settings
    RESEND_API_KEY: str | None = os.getenv("RESEND_API_KEY")
    DEFAULT_FROM_EMAIL: str = os.getenv("DEFAULT_FROM_EMAIL", "onboarding@resend.dev")

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://iqtvcmaesgrckywpfbwu.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "sb_publishable_2Ru-p3YvuUkg88ZT8Z5j7A_gVVAYj6Q")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))  # 7 days

settings = Settings()
