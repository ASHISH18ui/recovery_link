import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RecoverLink"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "recoverlink-super-secret-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLite for local dev by default, or Postgres: postgresql+psycopg2://user:password@localhost/recoverlink
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./recoverlink.db")
    
    # Optional AI Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Patient portal base URL
    PATIENT_PORTAL_URL: str = os.getenv("PATIENT_PORTAL_URL", "http://localhost:3000/recovery")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()

