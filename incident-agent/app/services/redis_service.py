"""
Redis service: caching, incident state, pub/sub for real-time events.
"""
import json
import logging
from typing import Any, Optional
import redis.asyncio as aioredis
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_redis: Optional[aioredis.Redis] = None


async def init_redis():
    global _redis
    _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await _redis.ping()
    logger.info("✅ Redis connected")


def get_redis() -> aioredis.Redis:
    if _redis is None:
        raise RuntimeError("Redis not initialised — call init_redis() first")
    return _redis


# ── Convenience helpers ──────────────────────────────────────────────────────

async def cache_set(key: str, value: Any, ttl: int = 300):
    r = get_redis()
    await r.setex(key, ttl, json.dumps(value, default=str))


async def cache_get(key: str) -> Optional[Any]:
    r = get_redis()
    raw = await r.get(key)
    return json.loads(raw) if raw else None


async def publish_event(channel: str, event: dict):
    r = get_redis()
    await r.publish(channel, json.dumps(event, default=str))


async def push_incident_event(incident_id: str, event: dict):
    """Append to the incident timeline stream."""
    r = get_redis()
    await r.xadd(f"timeline:{incident_id}", {"data": json.dumps(event, default=str)})


async def get_incident_timeline(incident_id: str) -> list:
    r = get_redis()
    entries = await r.xrange(f"timeline:{incident_id}")
    return [json.loads(e[1]["data"]) for e in entries]
