"""
Docker log collector — streams logs from running containers.
Also exposes per-container CPU/memory stats.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, List

import docker
from docker.errors import DockerException

from app.models.schemas import LogEntry, MetricPoint
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class DockerLogCollector:
    def __init__(self):
        try:
            self._client = docker.from_env()
        except DockerException as e:
            logger.warning(f"Docker not available: {e}")
            self._client = None

    def _list_containers(self) -> list:
        if not self._client:
            return []
        return self._client.containers.list()

    async def stream(self) -> AsyncGenerator[LogEntry, None]:
        """Yields log lines from all running containers."""
        while True:
            containers = await asyncio.to_thread(self._list_containers)
            for container in containers:
                try:
                    raw_logs = await asyncio.to_thread(
                        container.logs, tail=20, timestamps=True
                    )
                    for line in raw_logs.decode("utf-8", errors="ignore").splitlines():
                        if not line.strip():
                            continue
                        yield LogEntry(
                            timestamp=datetime.now(tz=timezone.utc),
                            source="docker",
                            service=container.name,
                            level="ERROR" if "error" in line.lower() else "INFO",
                            message=line,
                            metadata={"container_id": container.short_id},
                        )
                except Exception as e:
                    logger.debug(f"Log read error for {container.name}: {e}")
            await asyncio.sleep(15)

    def get_container_stats(self, service_name: str) -> List[MetricPoint]:
        """Return CPU + memory metrics for a named container."""
        if not self._client:
            return []
        metrics = []
        try:
            container = self._client.containers.get(service_name)
            stats = container.stats(stream=False)
            # CPU
            cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                        stats["precpu_stats"]["cpu_usage"]["total_usage"]
            system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                           stats["precpu_stats"]["system_cpu_usage"]
            num_cpus = stats["cpu_stats"].get("online_cpus", 1)
            cpu_pct = (cpu_delta / system_delta) * num_cpus * 100.0 if system_delta else 0

            # Memory
            mem_usage = stats["memory_stats"]["usage"]
            mem_limit = stats["memory_stats"]["limit"]
            mem_pct = (mem_usage / mem_limit) * 100.0 if mem_limit else 0

            # Restart count
            restart_count = container.attrs["RestartCount"]

            now = datetime.now(tz=timezone.utc)
            metrics.extend([
                MetricPoint(timestamp=now, service=service_name, metric_name="cpu_percent", value=cpu_pct, unit="%"),
                MetricPoint(timestamp=now, service=service_name, metric_name="memory_percent", value=mem_pct, unit="%"),
                MetricPoint(timestamp=now, service=service_name, metric_name="memory_mb", value=mem_usage / 1e6, unit="MB"),
                MetricPoint(timestamp=now, service=service_name, metric_name="restart_count", value=restart_count, unit="count"),
            ])
        except Exception as e:
            logger.warning(f"Stats error for {service_name}: {e}")
        return metrics
