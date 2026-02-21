"""
AWS CloudWatch log collector.
Streams log events from a CloudWatch log group into the detection pipeline.
"""
import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import AsyncGenerator, List

import boto3
from botocore.exceptions import ClientError

from app.models.schemas import LogEntry
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _make_client():
    return boto3.client(
        "logs",
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
    )


class CloudWatchLogCollector:
    """
    Polls a CloudWatch Log Group for new events and yields normalised LogEntry objects.
    Uses filter_log_events with a moving start_time so no event is processed twice.
    """

    def __init__(self, log_group: str = settings.CLOUDWATCH_LOG_GROUP):
        self.log_group = log_group
        self._client = _make_client()
        self._start_time_ms: int = int(time.time() * 1000) - 5 * 60 * 1000  # last 5 min

    def _fetch_events(self) -> List[dict]:
        try:
            response = self._client.filter_log_events(
                logGroupName=self.log_group,
                startTime=self._start_time_ms,
                limit=100,
            )
            events = response.get("events", [])
            if events:
                # Advance cursor past the newest event
                self._start_time_ms = events[-1]["timestamp"] + 1
            return events
        except ClientError as e:
            logger.warning(f"CloudWatch fetch error: {e}")
            return []

    def _parse_event(self, event: dict) -> LogEntry:
        msg = event.get("message", "")
        level = "INFO"
        if "ERROR" in msg or "CRITICAL" in msg:
            level = "ERROR"
        elif "WARN" in msg:
            level = "WARN"

        return LogEntry(
            timestamp=datetime.fromtimestamp(event["timestamp"] / 1000, tz=timezone.utc),
            source="cloudwatch",
            service=event.get("logStreamName", "unknown"),
            level=level,
            message=msg,
            metadata={"event_id": event.get("eventId", "")},
        )

    async def stream(self) -> AsyncGenerator[LogEntry, None]:
        """Async generator: poll CloudWatch every N seconds."""
        while True:
            events = await asyncio.to_thread(self._fetch_events)
            for raw in events:
                yield self._parse_event(raw)
            await asyncio.sleep(settings.CLOUDWATCH_POLL_INTERVAL)


# ── CloudWatch Metrics helper ─────────────────────────────────────────────────

class CloudWatchMetricsCollector:
    """
    Fetches EC2 / custom metrics from CloudWatch for anomaly detection.
    """

    def __init__(self):
        self._client = boto3.client(
            "cloudwatch",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        )

    def get_metric(
        self,
        namespace: str,
        metric_name: str,
        dimensions: list,
        period: int = 60,
        stat: str = "Average",
        minutes: int = 5,
    ) -> List[dict]:
        from datetime import timedelta
        end = datetime.utcnow()
        start = end - timedelta(minutes=minutes)
        try:
            resp = self._client.get_metric_statistics(
                Namespace=namespace,
                MetricName=metric_name,
                Dimensions=dimensions,
                StartTime=start,
                EndTime=end,
                Period=period,
                Statistics=[stat],
            )
            return sorted(resp.get("Datapoints", []), key=lambda x: x["Timestamp"])
        except ClientError as e:
            logger.warning(f"CloudWatch metrics error: {e}")
            return []

    def ec2_cpu(self, instance_id: str = settings.EC2_INSTANCE_ID) -> float:
        """Latest EC2 CPU utilisation percent."""
        points = self.get_metric(
            "AWS/EC2",
            "CPUUtilization",
            [{"Name": "InstanceId", "Value": instance_id}],
        )
        return points[-1]["Average"] if points else 0.0

    def rds_connections(self, db_instance: str) -> float:
        points = self.get_metric(
            "AWS/RDS",
            "DatabaseConnections",
            [{"Name": "DBInstanceIdentifier", "Value": db_instance}],
        )
        return points[-1]["Average"] if points else 0.0

    def custom_metric(self, metric_name: str, service: str) -> float:
        points = self.get_metric(
            settings.CLOUDWATCH_METRIC_NAMESPACE,
            metric_name,
            [{"Name": "Service", "Value": service}],
        )
        return points[-1]["Average"] if points else 0.0

    def publish_metric(self, metric_name: str, value: float, service: str, unit: str = "None"):
        """Publish a custom metric to CloudWatch (used by verification engine)."""
        try:
            self._client.put_metric_data(
                Namespace=settings.CLOUDWATCH_METRIC_NAMESPACE,
                MetricData=[{
                    "MetricName": metric_name,
                    "Value": value,
                    "Unit": unit,
                    "Dimensions": [{"Name": "Service", "Value": service}],
                }],
            )
        except ClientError as e:
            logger.warning(f"Failed to publish metric: {e}")
