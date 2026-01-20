# Backend configuration settings
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # MongoDB
    mongo_url: str = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name: str = os.environ.get('DB_NAME', 'vulnscan_db')
    
    # JWT
    secret_key: str = os.environ.get('SECRET_KEY', 'your-super-secret-key-change-in-production-min-32-chars')
    algorithm: str = 'HS256'
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # CORS
    cors_origins: str = os.environ.get('CORS_ORIGINS', '*')
    
    # Hugging Face (will be set by user later)
    hf_token: str = os.environ.get('HF_TOKEN', '')
    hf_model_detection: str = os.environ.get('HF_MODEL_DETECTION', 'meta-llama/Llama-2-7b-chat-hf')
    
    # GitHub
    github_client_id: str = os.environ.get('GITHUB_CLIENT_ID', '')
    github_client_secret: str = os.environ.get('GITHUB_CLIENT_SECRET', '')
    
    class Config:
        env_file = '.env'
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
