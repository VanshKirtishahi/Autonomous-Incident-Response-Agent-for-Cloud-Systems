"""
AI Incident Agent - FastAPI Brain
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import incidents, health, metrics, reports, learning
from app.services.redis_service import init_redis
from app.services.mongodb_service import init_mongodb
from app.engines.detector import AnomalyDetector
from app.services.log_stream import start_log_streaming

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("🚀 Starting AI Incident Agent...")
    await init_redis()
    await init_mongodb()
    # Start background log streaming from CloudWatch
    asyncio.create_task(start_log_streaming())
    logger.info("✅ Agent ready.")
    yield
    logger.info("🛑 Shutting down agent...")


app = FastAPI(
    title="AI Incident Agent",
    description="Autonomous SRE: detects, diagnoses, remediates, and learns from cloud incidents.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents.router, prefix="/incidents", tags=["Incidents"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(learning.router, prefix="/learning", tags=["Learning"])


@app.get("/")
async def root():
    return {"status": "online", "agent": "AI Incident Agent v1.0"}
