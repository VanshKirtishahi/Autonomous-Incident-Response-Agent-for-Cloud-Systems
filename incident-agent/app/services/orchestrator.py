"""
Incident Orchestrator
Full lifecycle: detect → diagnose → plan → execute → verify → report → learn
"""
import asyncio
import logging
from datetime import datetime, timezone

from app.engines.detector import AnomalyDetector
from app.engines.diagnosis import DiagnosisEngine
from app.engines.executor import RemediationExecutor
from app.engines.verifier import VerificationEngine
from app.engines.reporter import IncidentReporter
from app.engines.learning import LearningEngine
from app.models.schemas import (
    AnomalySignal, Incident, IncidentStatus, MetricPoint
)
from app.services.mongodb_service import save_incident
from app.services.redis_service import push_incident_event

logger = logging.getLogger(__name__)

# Singletons
_detector = AnomalyDetector()
_diagnoser = DiagnosisEngine()
_executor = RemediationExecutor()
_verifier = VerificationEngine()
_reporter = IncidentReporter()
_learner = LearningEngine()


def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _add_timeline(incident: Incident, message: str):
    event = {"timestamp": _ts(), "message": message, "status": incident.status}
    incident.timeline.append(event)
    await push_incident_event(incident.incident_id, event)


async def handle_signal(signal: AnomalySignal) -> Incident:
    """
    Full incident lifecycle for a detected anomaly signal.
    """
    incident = Incident(
        service=signal.service,
        incident_type=signal.incident_type,
        severity=signal.severity,
        status=IncidentStatus.DETECTED,
        signal=signal,
    )

    logger.info(f"🚨 New incident {incident.incident_id}: {incident.incident_type} on {incident.service}")
    await _add_timeline(incident, f"Anomaly detected: {signal.incident_type} (confidence {signal.confidence:.0%})")
    await save_incident(incident)

    # ── 1. Diagnose ──────────────────────────────────────────────────────────
    incident.status = IncidentStatus.DIAGNOSING
    await _add_timeline(incident, "Starting diagnosis...")
    await save_incident(incident)

    # Check learning KB first for a known solution
    recalled = await _learner.recall(signal.incident_type, str(signal.evidence))
    if recalled:
        logger.info(f"📚 KB recalled action: {recalled} for {signal.incident_type}")

    diagnosis = await _diagnoser.diagnose(signal)
    incident.diagnosis = diagnosis

    # Override action with KB-recalled one if confidence is high enough
    if recalled and diagnosis.confidence > 0.7:
        diagnosis.recommended_action = recalled
        await _add_timeline(incident, f"KB match found — using known fix: {recalled}")

    await _add_timeline(incident, f"Diagnosis: {diagnosis.root_cause[:120]}...")
    await save_incident(incident)

    # ── 2. Remediate ─────────────────────────────────────────────────────────
    incident.status = IncidentStatus.REMEDIATING
    await _add_timeline(incident, f"Executing: {diagnosis.recommended_action}")
    await save_incident(incident)

    remediation = await _executor.execute(
        diagnosis.recommended_action,
        signal.service,
        context={"reason": diagnosis.root_cause},
    )
    incident.remediation = remediation
    await _add_timeline(incident, f"Remediation {'succeeded' if remediation.success else 'FAILED'}: {remediation.output[:100]}")
    await save_incident(incident)

    # ── 3. Verify ────────────────────────────────────────────────────────────
    incident.status = IncidentStatus.VERIFYING
    await _add_timeline(incident, "Verifying recovery...")
    await save_incident(incident)

    verification = await _verifier.verify(signal, remediation)
    incident.verification = verification

    if verification.healthy:
        incident.status = IncidentStatus.RESOLVED
        incident.resolved_at = datetime.now(timezone.utc)
        await _add_timeline(incident, "✅ Service recovered and healthy.")
    else:
        incident.status = IncidentStatus.ESCALATED
        await _add_timeline(incident, "❌ Not recovered — escalating to human SRE.")

    await save_incident(incident)

    # ── 4. Report ────────────────────────────────────────────────────────────
    report_path = _reporter.generate(incident)
    incident.report_path = report_path
    await _add_timeline(incident, f"Report generated: {report_path}")
    await save_incident(incident)

    # ── 5. Learn ─────────────────────────────────────────────────────────────
    await _learner.learn(incident)

    logger.info(f"{'✅' if incident.status == IncidentStatus.RESOLVED else '🚨'} Incident {incident.incident_id} complete: {incident.status}")
    return incident


async def process_metrics(points: list[MetricPoint]) -> list[Incident]:
    """
    Entry point for metric batches. Runs detection, then handles any signals.
    """
    signals = _detector.ingest(points)
    incidents = []
    for signal in signals:
        incident = await handle_signal(signal)
        incidents.append(incident)
    return incidents
