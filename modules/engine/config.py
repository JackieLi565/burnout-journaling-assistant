"""Configuration settings for the FastAPI backend."""
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Application settings."""
    
    # Firebase Configuration
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "demo-project")
    
    # Firebase Emulator Configuration
    USE_EMULATOR: bool = os.getenv("USE_EMULATOR", "True").lower() == "true"
    FIRESTORE_EMULATOR_HOST: str = os.getenv("FIRESTORE_EMULATOR_HOST", "localhost:8080")
    
    # Server Configuration
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    
    # Gemini/LangExtract Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_LIVE_MODEL: str = os.getenv(
        "GEMINI_LIVE_MODEL",
        "models/gemini-3.1-flash-live-preview",
    )
    GEMINI_LIVE_VOICE: str = os.getenv("GEMINI_LIVE_VOICE", "Kore")
    LIVE_SESSION_SECRET: str = os.getenv("LIVE_SESSION_SECRET", "")
    
    class Config:
        case_sensitive = True

settings = Settings()
