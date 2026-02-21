"""
Diagnosis Engine
Determines root cause from an AnomalySignal using:
  1. Rule-based correlation (fast, deterministic)
  2. Historical KB lookup (learning engine)
  3. LLM reasoning (OpenAI) for explanation and confidence boost
"""
import logging
from typing import Optional

from app.models.schemas import (
    AnomalySignal, DiagnosisResult, IncidentType, RemediationAction
)
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ─────────────────────────────────────────────────────────────────────────────
# Decision table: IncidentType → (root_cause_text, RemediationAction)
# ─────────────────────────────────────────────────────────────────────────────

RULE_TABLE = {
    IncidentType.MEMORY_LEAK: {
        "root_cause": "Memory usage continuously rising — likely a memory leak in application code or OOM due to load spike.",
        "action": RemediationAction.RESTART_SERVICE,
    },
    IncidentType.CRASH_LOOP: {
        "root_cause": "Container restart count exceeds threshold — application is crashing repeatedly (crash loop).",
        "action": RemediationAction.ROLLBACK_DEPLOYMENT,
    },
    IncidentType.DB_SATURATION: {
        "root_cause": "Database connection count high and latency spiking — DB is saturated.",
        "action": RemediationAction.SCALE_DB,
    },
    IncidentType.CPU_SPIKE: {
        "root_cause": "CPU utilisation above threshold — potential runaway process or unexpected traffic surge.",
        "action": RemediationAction.SCALE_SERVICE,
    },
    IncidentType.DISK_FULL: {
        "root_cause": "Disk usage at capacity — logs or data may need rotation or cleanup.",
        "action": RemediationAction.NOTIFY_HUMAN,
    },
    IncidentType.UNKNOWN: {
        "root_cause": "Anomaly detected by ML but root cause is unclear.",
        "action": RemediationAction.NOTIFY_HUMAN,
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# LLM reasoning helper
# ─────────────────────────────────────────────────────────────────────────────

async def _llm_explain(signal: AnomalySignal, rule_diagnosis: dict) -> str:
    """
    Call OpenAI to produce a human-readable diagnosis explanation.
    Falls back to rule text if LLM is unavailable.
    """
    if not settings.OPENAI_API_KEY:
        return rule_diagnosis["root_cause"]

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        evidence_str = "\n".join(f"  - {k}: {v}" for k, v in signal.evidence.items())
        prompt = f"""You are an expert SRE. A monitoring system detected an incident.

Incident type: {signal.incident_type}
Service: {signal.service}
Severity: {signal.severity}
Evidence:
{evidence_str}

Initial rule-based diagnosis: {rule_diagnosis["root_cause"]}
Planned remediation: {rule_diagnosis["action"]}

In 2-3 sentences, explain the likely root cause and why the planned action is appropriate.
Be concise and technical."""

        resp = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning(f"LLM diagnosis failed: {e}")
        return rule_diagnosis["root_cause"]


# ─────────────────────────────────────────────────────────────────────────────
# KB lookup for confidence boost
# ─────────────────────────────────────────────────────────────────────────────

async def _kb_confidence_boost(incident_type: IncidentType) -> float:
    """Check if we've seen and resolved this incident type before."""
    try:
        from app.services.mongodb_service import get_knowledge
        entries = await get_knowledge(incident_type)
        if entries:
            # Each past resolution boosts confidence a little
            boost = sum(e.confidence_boost for e in entries)
            return min(0.15, boost)
    except Exception as e:
        logger.debug(f"KB lookup failed: {e}")
    return 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Main Diagnosis Engine
# ─────────────────────────────────────────────────────────────────────────────

class DiagnosisEngine:
    async def diagnose(self, signal: AnomalySignal) -> DiagnosisResult:
        logger.info(f"🔍 Diagnosing {signal.incident_type} on {signal.service}")

        rule = RULE_TABLE.get(signal.incident_type, RULE_TABLE[IncidentType.UNKNOWN])

        # Parallel: LLM reasoning + KB lookup
        reasoning = await _llm_explain(signal, rule)
        kb_boost = await _kb_confidence_boost(signal.incident_type)

        confidence = min(1.0, signal.confidence + kb_boost)

        return DiagnosisResult(
            root_cause=rule["root_cause"],
            incident_type=signal.incident_type,
            confidence=round(confidence, 3),
            reasoning=reasoning,
            correlated_signals=[str(m.metric_name) for m in signal.raw_metrics],
            recommended_action=rule["action"],
        )
