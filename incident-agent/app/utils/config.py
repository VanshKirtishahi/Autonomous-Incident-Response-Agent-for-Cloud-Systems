"""
Centralized configuration via environment variables.
Copy .env.example → .env and fill in your values.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── AWS ────────────────────────────────
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    CLOUDWATCH_LOG_GROUP: str = "/incident-agent/app-logs"
    CLOUDWATCH_METRIC_NAMESPACE: str = "IncidentAgent"
    EC2_INSTANCE_ID: str = ""          # target EC2 for remediation
    ECS_CLUSTER: str = ""              # if using ECS
    ECS_SERVICE: str = ""

    # ── Redis ──────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"

    # ── MongoDB ────────────────────────────
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "incident_agent"

    # ── OpenAI / LLM (for diagnosis reasoning) ─
    OPENAI_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"

    # ── ChromaDB (vector KB) ────────────────
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8001

    # ── Detection thresholds ───────────────
    CPU_THRESHOLD_PCT: float = 85.0
    MEMORY_THRESHOLD_PCT: float = 85.0
    DB_CONNECTIONS_THRESHOLD: int = 80
    RESTART_COUNT_THRESHOLD: int = 3
    ERROR_RATE_THRESHOLD: float = 0.10   # 10%

    # ── Polling intervals (seconds) ────────
    CLOUDWATCH_POLL_INTERVAL: int = 30
    METRIC_WINDOW_SECONDS: int = 300     # 5-min window for anomaly detection

    # ── Misc ───────────────────────────────
    REPORTS_DIR: str = "reports"
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
