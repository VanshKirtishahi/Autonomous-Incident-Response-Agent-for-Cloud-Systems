"""
Detection Engine
Runs three detection layers in order:
  1. Threshold rules   → fast, deterministic
  2. Z-score           → statistical drift
  3. Isolation Forest  → ML-based novelty detection

Emits AnomalySignal objects.
"""
import logging
from collections import defaultdict, deque
from datetime import datetime
from typing import Deque, Dict, List, Optional

import numpy as np
from sklearn.ensemble import IsolationForest

from app.models.schemas import (
    AnomalySignal, IncidentType, MetricPoint, Severity
)
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# How many metric points to keep per (service, metric) for statistical detection
WINDOW_SIZE = 60


# ─────────────────────────────────────────────────────────────────────────────
# Threshold Rules
# ─────────────────────────────────────────────────────────────────────────────

THRESHOLD_RULES = [
    {
        "metric": "cpu_percent",
        "threshold": settings.CPU_THRESHOLD_PCT,
        "op": "gt",
        "incident_type": IncidentType.CPU_SPIKE,
        "severity": Severity.HIGH,
        "confidence": 0.85,
    },
    {
        "metric": "memory_percent",
        "threshold": settings.MEMORY_THRESHOLD_PCT,
        "op": "gt",
        "incident_type": IncidentType.MEMORY_LEAK,
        "severity": Severity.HIGH,
        "confidence": 0.80,
    },
    {
        "metric": "db_connections",
        "threshold": settings.DB_CONNECTIONS_THRESHOLD,
        "op": "gt",
        "incident_type": IncidentType.DB_SATURATION,
        "severity": Severity.CRITICAL,
        "confidence": 0.90,
    },
    {
        "metric": "restart_count",
        "threshold": settings.RESTART_COUNT_THRESHOLD,
        "op": "gt",
        "incident_type": IncidentType.CRASH_LOOP,
        "severity": Severity.CRITICAL,
        "confidence": 0.95,
    },
]


def _check_threshold(point: MetricPoint) -> Optional[AnomalySignal]:
    for rule in THRESHOLD_RULES:
        if point.metric_name != rule["metric"]:
            continue
        triggered = (
            point.value > rule["threshold"] if rule["op"] == "gt"
            else point.value < rule["threshold"]
        )
        if triggered:
            return AnomalySignal(
                service=point.service,
                incident_type=rule["incident_type"],
                severity=rule["severity"],
                confidence=rule["confidence"],
                evidence={
                    "metric": point.metric_name,
                    "value": point.value,
                    "threshold": rule["threshold"],
                    "detection_method": "threshold",
                },
                raw_metrics=[point],
            )
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Z-Score Detection
# ─────────────────────────────────────────────────────────────────────────────

Z_SCORE_THRESHOLD = 3.0


def _zscore(values: np.ndarray, value: float) -> float:
    if len(values) < 10:
        return 0.0
    mu, sigma = np.mean(values), np.std(values)
    return abs(value - mu) / sigma if sigma > 0 else 0.0


def _check_zscore(
    point: MetricPoint, history: Deque[float]
) -> Optional[AnomalySignal]:
    arr = np.array(list(history))
    z = _zscore(arr, point.value)
    if z > Z_SCORE_THRESHOLD:
        # Map metric to incident type
        itype = {
            "cpu_percent": IncidentType.CPU_SPIKE,
            "memory_percent": IncidentType.MEMORY_LEAK,
            "memory_mb": IncidentType.MEMORY_LEAK,
            "db_connections": IncidentType.DB_SATURATION,
            "restart_count": IncidentType.CRASH_LOOP,
        }.get(point.metric_name, IncidentType.UNKNOWN)

        severity = Severity.HIGH if z > 5 else Severity.MEDIUM
        confidence = min(0.9, 0.5 + (z - Z_SCORE_THRESHOLD) * 0.1)

        return AnomalySignal(
            service=point.service,
            incident_type=itype,
            severity=severity,
            confidence=confidence,
            evidence={
                "metric": point.metric_name,
                "value": point.value,
                "z_score": round(z, 2),
                "mean": round(float(np.mean(arr)), 2),
                "std": round(float(np.std(arr)), 2),
                "detection_method": "zscore",
            },
            raw_metrics=[point],
        )
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Isolation Forest (ML)
# ─────────────────────────────────────────────────────────────────────────────

class IsolationForestDetector:
    def __init__(self):
        self._models: Dict[str, IsolationForest] = {}
        self._fit_counts: Dict[str, int] = defaultdict(int)
        self._min_samples = 30

    def fit_or_update(self, key: str, data: np.ndarray):
        if len(data) >= self._min_samples:
            model = IsolationForest(contamination=0.05, random_state=42)
            model.fit(data.reshape(-1, 1))
            self._models[key] = model

    def predict(self, key: str, value: float) -> bool:
        """Returns True if the value is an outlier."""
        model = self._models.get(key)
        if model is None:
            return False
        pred = model.predict([[value]])
        return pred[0] == -1  # -1 = anomaly

    def score(self, key: str, value: float) -> float:
        model = self._models.get(key)
        if model is None:
            return 0.0
        return float(-model.score_samples([[value]])[0])  # higher = more anomalous


# ─────────────────────────────────────────────────────────────────────────────
# Main Detector
# ─────────────────────────────────────────────────────────────────────────────

class AnomalyDetector:
    def __init__(self):
        self._history: Dict[str, Deque[float]] = defaultdict(lambda: deque(maxlen=WINDOW_SIZE))
        self._if_detector = IsolationForestDetector()
        self._cooldown: Dict[str, datetime] = {}  # prevent alert storms
        self._cooldown_seconds = 120

    def _cooldown_key(self, service: str, metric: str) -> str:
        return f"{service}:{metric}"

    def _is_cooling_down(self, key: str) -> bool:
        if key not in self._cooldown:
            return False
        delta = (datetime.utcnow() - self._cooldown[key]).total_seconds()
        return delta < self._cooldown_seconds

    def _set_cooldown(self, key: str):
        self._cooldown[key] = datetime.utcnow()

    def ingest(self, points: List[MetricPoint]) -> List[AnomalySignal]:
        signals = []
        for point in points:
            hkey = f"{point.service}:{point.metric_name}"
            history = self._history[hkey]

            # --- Layer 1: Threshold ---
            if not self._is_cooling_down(hkey):
                sig = _check_threshold(point)
                if sig:
                    signals.append(sig)
                    self._set_cooldown(hkey)
                    history.append(point.value)
                    continue

            # --- Layer 2: Z-score ---
            if not self._is_cooling_down(hkey) and len(history) >= 10:
                sig = _check_zscore(point, history)
                if sig:
                    signals.append(sig)
                    self._set_cooldown(hkey)

            # --- Layer 3: Isolation Forest ---
            arr = np.array(list(history))
            self._if_detector.fit_or_update(hkey, arr)
            if not self._is_cooling_down(hkey) and self._if_detector.predict(hkey, point.value):
                itype = IncidentType.UNKNOWN
                score = self._if_detector.score(hkey, point.value)
                sig = AnomalySignal(
                    service=point.service,
                    incident_type=itype,
                    severity=Severity.MEDIUM,
                    confidence=min(0.75, 0.4 + score * 0.1),
                    evidence={
                        "metric": point.metric_name,
                        "value": point.value,
                        "anomaly_score": round(score, 4),
                        "detection_method": "isolation_forest",
                    },
                    raw_metrics=[point],
                )
                signals.append(sig)
                self._set_cooldown(hkey)

            history.append(point.value)

        return signals
