import os
from typing import List
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

def normalize_database_url(url: str) -> str:
    if not url or not url.strip():
        # Default to local SQLite when DATABASE_URL is not set
        return "sqlite:///./recoverlink.db"
    
    url = url.strip()
    # Convert postgres:// or postgresql:// to postgresql+psycopg2:// or standard postgresql://
    # Render and Heroku often provide postgres:// which is deprecated in SQLAlchemy 1.4+
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    
    return url

class Settings:
    PROJECT_NAME: str = "RecoverLink"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # JWT Authentication
    JWT_SECRET: str = (
        os.getenv("JWT_SECRET")
        or os.getenv("SECRET_KEY")
        or "recoverlink-super-secret-jwt-key-change-in-production-2026"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    @property
    def SECRET_KEY(self) -> str:
        """Alias for backward compatibility with existing security utilities."""
        return self.JWT_SECRET

    # Database URL with postgres:// -> postgresql:// conversion and SQLite fallback
    @property
    def DATABASE_URL(self) -> str:
        return normalize_database_url(os.getenv("DATABASE_URL", ""))

    # Gemini API Key (optional AI enhancement, falls back to clinical rules)
    @property
    def GEMINI_API_KEY(self) -> str:
        return os.getenv("GEMINI_API_KEY", "")

    @property
    def OPENAI_API_KEY(self) -> str:
        return os.getenv("OPENAI_API_KEY", "")

    # Patient Portal Base URL
    @property
    def PATIENT_PORTAL_URL(self) -> str:
        return os.getenv("PATIENT_PORTAL_URL", "http://localhost:3000/check-in")

    # CORS Allowed Origins
    @property
    def ALLOWED_ORIGINS(self) -> str:
        return os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

    @property
    def cors_origins(self) -> List[str]:
        raw = self.ALLOWED_ORIGINS
        if not raw or not raw.strip():
            return ["http://localhost:3000"]
        if raw.strip() == "*":
            return ["*"]
        origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
        return origins if origins else ["http://localhost:3000"]

    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return self.cors_origins

settings = Settings()
