"""
Metrics ingestion route — POST raw metric points for immediate detection.
"""
from fastapi import APIRouter
from typing import List
from app.models.schemas import MetricPoint, Incident
from app.services.orchestrator import process_metrics

router = APIRouter()


@router.post("/ingest", response_model=List[Incident])
async def ingest_metrics(points: List[MetricPoint]):
    """
    Push raw metric points. Any anomalies detected will trigger full incident pipeline.
    """
    incidents = await process_metrics(points)
    return incidents
