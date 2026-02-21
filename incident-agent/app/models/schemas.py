"""
Core Pydantic models for the Incident Agent system.
"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import uuid


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────

class IncidentType(str, Enum):
    MEMORY_LEAK = "memory_leak"
    CRASH_LOOP = "crash_loop"
    DB_SATURATION = "db_saturation"
    CPU_SPIKE = "cpu_spike"
    DISK_FULL = "disk_full"
    UNKNOWN = "unknown"


class IncidentStatus(str, Enum):
    DETECTED = "detected"
    DIAGNOSING = "diagnosing"
    REMEDIATING = "remediating"
    VERIFYING = "verifying"
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    FAILED = "failed"


class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RemediationAction(str, Enum):
    RESTART_SERVICE = "restart_service"
    ROLLBACK_DEPLOYMENT = "rollback_deployment"
    SCALE_DB = "scale_db"
    SCALE_SERVICE = "scale_service"
    CLEAR_CACHE = "clear_cache"
    NOTIFY_HUMAN = "notify_human"
    NO_ACTION = "no_action"


# ─────────────────────────────────────────────
# Log / Metric models
# ─────────────────────────────────────────────

class LogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str  # e.g. "cloudwatch", "docker"
    service: str
    level: str  # INFO / WARN / ERROR
    message: str
    metadata: Dict[str, Any] = {}


class MetricPoint(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    service: str
    metric_name: str  # cpu_percent, memory_mb, db_connections, etc.
    value: float
    unit: str = ""
    tags: Dict[str, str] = {}


# ─────────────────────────────────────────────
# Anomaly / Detection
# ─────────────────────────────────────────────

class AnomalySignal(BaseModel):
    signal_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    detected_at: datetime = Field(default_factory=datetime.utcnow)
    service: str
    incident_type: IncidentType
    severity: Severity
    confidence: float = Field(ge=0.0, le=1.0)
    evidence: Dict[str, Any] = {}
    raw_metrics: List[MetricPoint] = []


# ─────────────────────────────────────────────
# Diagnosis
# ─────────────────────────────────────────────

class DiagnosisResult(BaseModel):
    root_cause: str
    incident_type: IncidentType
    confidence: float
    reasoning: str  # LLM or rule explanation
    correlated_signals: List[str] = []
    recommended_action: RemediationAction


# ─────────────────────────────────────────────
# Remediation
# ─────────────────────────────────────────────

class RemediationResult(BaseModel):
    action: RemediationAction
    success: bool
    output: str
    executed_at: datetime = Field(default_factory=datetime.utcnow)
    duration_seconds: float = 0.0


# ─────────────────────────────────────────────
# Verification
# ─────────────────────────────────────────────

class VerificationResult(BaseModel):
    healthy: bool
    checks: Dict[str, bool] = {}
    message: str
    verified_at: datetime = Field(default_factory=datetime.utcnow)


# ─────────────────────────────────────────────
# Incident (full lifecycle)
# ─────────────────────────────────────────────

class Incident(BaseModel):
    incident_id: str = Field(default_factory=lambda: f"INC-{uuid.uuid4().hex[:8].upper()}")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

    service: str
    incident_type: IncidentType
    severity: Severity
    status: IncidentStatus = IncidentStatus.DETECTED

    signal: Optional[AnomalySignal] = None
    diagnosis: Optional[DiagnosisResult] = None
    remediation: Optional[RemediationResult] = None
    verification: Optional[VerificationResult] = None

    timeline: List[Dict[str, Any]] = []
    report_path: Optional[str] = None


# ─────────────────────────────────────────────
# Learning / Knowledge Base
# ─────────────────────────────────────────────

class KnowledgeEntry(BaseModel):
    entry_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    incident_type: IncidentType
    pattern_description: str
    successful_action: RemediationAction
    confidence_boost: float = 0.1
    occurrence_count: int = 1
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    embedding: Optional[List[float]] = None  # for vector search
