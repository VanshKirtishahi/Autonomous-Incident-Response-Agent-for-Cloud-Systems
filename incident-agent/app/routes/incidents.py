"""
Incident routes: list, get, manually trigger, get timeline.
"""
from fastapi import APIRouter, HTTPException
from typing import List

from app.models.schemas import AnomalySignal, Incident, IncidentType, Severity
from app.services.mongodb_service import get_incident, list_incidents
from app.services.orchestrator import handle_signal
from app.services.redis_service import get_incident_timeline

router = APIRouter()


@router.get("/", response_model=List[Incident])
async def get_incidents(limit: int = 50):
    """List recent incidents."""
    return await list_incidents(limit)


@router.get("/{incident_id}", response_model=Incident)
async def get_incident_by_id(incident_id: str):
    inc = await get_incident(incident_id)
    if not inc:
        raise HTTPException(404, f"Incident {incident_id} not found")
    return inc


@router.get("/{incident_id}/timeline")
async def get_timeline(incident_id: str):
    events = await get_incident_timeline(incident_id)
    return {"incident_id": incident_id, "events": events}


@router.post("/simulate", response_model=Incident)
async def simulate_incident(
    service: str = "my-app",
    incident_type: IncidentType = IncidentType.MEMORY_LEAK,
    severity: Severity = Severity.HIGH,
    confidence: float = 0.92,
):
    """
    Manually inject a simulated anomaly signal for testing.
    Triggers the full detection → diagnosis → remediation → verify → report pipeline.
    """
    signal = AnomalySignal(
        service=service,
        incident_type=incident_type,
        severity=severity,
        confidence=confidence,
        evidence={
            "metric": "simulated",
            "value": 95.0,
            "detection_method": "manual_simulation",
        },
    )
    incident = await handle_signal(signal)
    return incident
