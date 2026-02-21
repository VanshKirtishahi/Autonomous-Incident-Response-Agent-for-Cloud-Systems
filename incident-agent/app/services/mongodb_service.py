"""
MongoDB service: persistent storage for incidents, reports, knowledge base.
"""
import logging
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.utils.config import get_settings
from app.models.schemas import Incident, KnowledgeEntry

logger = logging.getLogger(__name__)
settings = get_settings()

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def init_mongodb():
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    _db = _client[settings.MONGODB_DB]
    # Create indexes
    await _db.incidents.create_index("incident_id", unique=True)
    await _db.incidents.create_index("created_at")
    await _db.knowledge.create_index("incident_type")
    logger.info("✅ MongoDB connected")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("MongoDB not initialised")
    return _db


# ── Incident CRUD ────────────────────────────────────────────────────────────

async def save_incident(incident: Incident):
    db = get_db()
    doc = incident.model_dump(mode="json")
    await db.incidents.replace_one(
        {"incident_id": incident.incident_id},
        doc,
        upsert=True,
    )


async def get_incident(incident_id: str) -> Optional[Incident]:
    db = get_db()
    doc = await db.incidents.find_one({"incident_id": incident_id})
    return Incident(**doc) if doc else None


async def list_incidents(limit: int = 50) -> List[Incident]:
    db = get_db()
    cursor = db.incidents.find().sort("created_at", -1).limit(limit)
    return [Incident(**doc) async for doc in cursor]


# ── Knowledge Base ────────────────────────────────────────────────────────────

async def upsert_knowledge(entry: KnowledgeEntry):
    db = get_db()
    await db.knowledge.replace_one(
        {"incident_type": entry.incident_type, "successful_action": entry.successful_action},
        entry.model_dump(mode="json"),
        upsert=True,
    )


async def get_knowledge(incident_type: str) -> List[KnowledgeEntry]:
    db = get_db()
    cursor = db.knowledge.find({"incident_type": incident_type})
    return [KnowledgeEntry(**doc) async for doc in cursor]


async def all_knowledge() -> List[KnowledgeEntry]:
    db = get_db()
    cursor = db.knowledge.find()
    return [KnowledgeEntry(**doc) async for doc in cursor]
