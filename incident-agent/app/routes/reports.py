"""Reports route — retrieve generated incident reports."""
import os
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from app.utils.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/")
async def list_reports():
    reports_dir = Path(settings.REPORTS_DIR)
    if not reports_dir.exists():
        return []
    files = sorted(reports_dir.glob("*.md"), reverse=True)
    return [{"filename": f.name, "size_bytes": f.stat().st_size} for f in files]


@router.get("/{filename}", response_class=PlainTextResponse)
async def get_report(filename: str):
    path = Path(settings.REPORTS_DIR) / filename
    if not path.exists() or path.suffix not in (".md", ".json"):
        raise HTTPException(404, "Report not found")
    return path.read_text()
