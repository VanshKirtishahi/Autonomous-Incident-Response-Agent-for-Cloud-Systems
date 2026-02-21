"""Learning / knowledge base routes."""
from fastapi import APIRouter
from app.services.mongodb_service import all_knowledge

router = APIRouter()


@router.get("/")
async def get_knowledge_base():
    entries = await all_knowledge()
    return entries
