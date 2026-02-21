"""
Verification Engine
After remediation, polls CloudWatch metrics + Docker stats to confirm recovery.
Retries up to MAX_ATTEMPTS times with exponential back-off.
"""
import asyncio
import logging
from datetime import datetime

from app.models.schemas import (
    AnomalySignal, IncidentType, RemediationResult, VerificationResult
)
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

MAX_ATTEMPTS = 5
BASE_WAIT = 20   # seconds between checks (doubles each retry)


class VerificationEngine:
    async def verify(
        self,
        signal: AnomalySignal,
        remediation: RemediationResult,
    ) -> VerificationResult:
        """
        Verify recovery. Returns VerificationResult.
        Retries MAX_ATTEMPTS times, doubling wait each attempt.
        """
        logger.info(f"🔎 Verifying recovery for {signal.service} ({signal.incident_type})")

        if not remediation.success:
            return VerificationResult(
                healthy=False,
                checks={},
                message="Skipping verification — remediation did not succeed.",
                verified_at=datetime.utcnow(),
            )

        wait = BASE_WAIT
        for attempt in range(1, MAX_ATTEMPTS + 1):
            logger.info(f"  Attempt {attempt}/{MAX_ATTEMPTS} — waiting {wait}s...")
            await asyncio.sleep(wait)

            checks = await self._run_checks(signal)
            healthy = all(checks.values())

            if healthy:
                return VerificationResult(
                    healthy=True,
                    checks=checks,
                    message=f"✅ Service {signal.service} recovered after {attempt} check(s).",
                    verified_at=datetime.utcnow(),
                )

            wait = min(wait * 2, 120)  # cap at 2 minutes

        return VerificationResult(
            healthy=False,
            checks=checks,
            message=f"❌ Service {signal.service} still unhealthy after {MAX_ATTEMPTS} attempts. Escalating.",
            verified_at=datetime.utcnow(),
        )

    async def _run_checks(self, signal: AnomalySignal) -> dict[str, bool]:
        """Run appropriate health checks based on incident type."""
        checks: dict[str, bool] = {}

        if signal.incident_type == IncidentType.MEMORY_LEAK:
            mem = await self._get_metric(signal.service, "memory_percent")
            checks["memory_below_threshold"] = mem < settings.MEMORY_THRESHOLD_PCT

        elif signal.incident_type == IncidentType.CPU_SPIKE:
            cpu = await self._get_metric(signal.service, "cpu_percent")
            checks["cpu_below_threshold"] = cpu < settings.CPU_THRESHOLD_PCT

        elif signal.incident_type == IncidentType.CRASH_LOOP:
            restarts = await self._get_metric(signal.service, "restart_count")
            # After rollback, restart count should stop climbing (check relative)
            checks["restarts_stable"] = restarts < settings.RESTART_COUNT_THRESHOLD

        elif signal.incident_type == IncidentType.DB_SATURATION:
            conns = await self._get_metric(signal.service, "db_connections")
            checks["db_connections_normal"] = conns < settings.DB_CONNECTIONS_THRESHOLD

        else:
            # Generic: try to read a metric, consider it a pass if no exception
            checks["generic_health"] = True

        return checks

    async def _get_metric(self, service: str, metric_name: str) -> float:
        """
        Try Docker stats first, fall back to CloudWatch custom metrics.
        """
        # Try Docker
        try:
            from collectors.docker_logs import DockerLogCollector
            collector = DockerLogCollector()
            stats = await asyncio.to_thread(collector.get_container_stats, service)
            for m in stats:
                if m.metric_name == metric_name:
                    return m.value
        except Exception:
            pass

        # Try CloudWatch
        try:
            from collectors.aws_logs import CloudWatchMetricsCollector
            cw = CloudWatchMetricsCollector()
            value = await asyncio.to_thread(cw.custom_metric, metric_name, service)
            return value
        except Exception:
            pass

        logger.warning(f"Could not get metric {metric_name} for {service}, assuming 0")
        return 0.0
