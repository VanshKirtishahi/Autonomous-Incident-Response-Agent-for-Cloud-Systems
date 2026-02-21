"""Health check route."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/")
async def health():
    return {"status": "ok"}

@router.get("/ready")
async def ready():
    from app.services.redis_service import get_redis
    from app.services.mongodb_service import get_db
    checks = {}
    try:
        await get_redis().ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = str(e)
    try:
        await get_db().command("ping")
        checks["mongodb"] = "ok"
    except Exception as e:
        checks["mongodb"] = str(e)
    healthy = all(v == "ok" for v in checks.values())
    return {"healthy": healthy, "checks": checks}
