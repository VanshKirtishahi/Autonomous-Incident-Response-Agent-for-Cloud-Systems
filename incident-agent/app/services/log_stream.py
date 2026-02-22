"""
Log streaming service — background task that:
1. Polls CloudWatch + Docker for logs
2. Extracts metrics from log lines
3. Feeds metric points to the orchestrator
4. Sends real-time logs to the backend for display
"""
import asyncio
import logging
import re
from datetime import datetime, timezone
import httpx

from app.models.schemas import MetricPoint
from app.services.orchestrator import process_metrics
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Backend URL for sending logs
BACKEND_URL = "http://localhost:5000/api/logs/realtime"  # We'll add this endpoint

# Patterns to extract metrics from log lines
METRIC_PATTERNS = [
    # memory: "MemoryUsage: 92%" or "memory=92%"
    (re.compile(r"(?i)memory[_\s:=]+(\d+(?:\.\d+)?)%"), "memory_percent", "%"),
    # cpu: "CPUUsage: 87.5%"
    (re.compile(r"(?i)cpu[_\s:=]+(\d+(?:\.\d+)?)%"), "cpu_percent", "%"),
    # db connections: "db_connections=105"
    (re.compile(r"(?i)db[_\s]?connections?[=:\s]+(\d+)"), "db_connections", "count"),
    # restart count: "RestartCount: 5"
    (re.compile(r"(?i)restart[_\s]?count[=:\s]+(\d+)"), "restart_count", "count"),
]


def _extract_metrics_from_log(log_entry) -> list[MetricPoint]:
    points = []
    for pattern, metric_name, unit in METRIC_PATTERNS:
        m = pattern.search(log_entry.message)
        if m:
            points.append(MetricPoint(
                timestamp=log_entry.timestamp,
                service=log_entry.service,
                metric_name=metric_name,
                value=float(m.group(1)),
                unit=unit,
            ))
    return points


async def start_log_streaming():
    """
    Background task: stream logs, extract metrics, feed to orchestrator, send to backend.
    """
    from collectors.aws_logs import CloudWatchLogCollector
    from collectors.docker_logs import DockerLogCollector

    cw_collector = CloudWatchLogCollector()
    docker_collector = DockerLogCollector()

    async def send_log_to_backend(log_entry):
        """Send log entry to backend for real-time display."""
        try:
            log_data = {
                "containerId": log_entry.service,  # Using service as containerId for simplicity
                "containerName": log_entry.service,
                "service": log_entry.service,
                "level": log_entry.level,
                "message": log_entry.message,
                "timestamp": log_entry.timestamp.isoformat(),
                "isAnomaly": "error" in log_entry.message.lower() or "fatal" in log_entry.message.lower(),
                "tags": ["docker", "realtime"]
            }
            async with httpx.AsyncClient() as client:
                await client.post(BACKEND_URL, json=log_data, timeout=5.0)
        except Exception as e:
            logger.warning(f"Failed to send log to backend: {e}")

    async def process_stream(stream):
        buffer = []
        async for log_entry in stream:
            # Send to backend for real-time display
            await send_log_to_backend(log_entry)
            
            metrics = _extract_metrics_from_log(log_entry)
            buffer.extend(metrics)
            if len(buffer) >= 10:
                await process_metrics(buffer)
                buffer.clear()

    logger.info("📡 Starting log streaming (CloudWatch + Docker)...")
    await asyncio.gather(
        process_stream(cw_collector.stream()),
        process_stream(docker_collector.stream()),
        return_exceptions=True,
    )
