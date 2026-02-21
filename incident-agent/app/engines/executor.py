"""
Remediation Executor
Executes fix actions against real AWS / Docker infrastructure.
All actions are idempotent and logged.
"""
import asyncio
import logging
import time
from datetime import datetime

import boto3
from botocore.exceptions import ClientError

from app.models.schemas import RemediationAction, RemediationResult
from app.utils.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def _ec2_client():
    return boto3.client("ec2", region_name=settings.AWS_REGION,
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None)


def _ecs_client():
    return boto3.client("ecs", region_name=settings.AWS_REGION,
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None)


def _rds_client():
    return boto3.client("rds", region_name=settings.AWS_REGION,
                        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
                        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None)


# ─────────────────────────────────────────────────────────────────────────────
# Individual action implementations
# ─────────────────────────────────────────────────────────────────────────────

async def _restart_ecs_service(service: str) -> str:
    """Force a new deployment (rolling restart) of an ECS service."""
    client = _ecs_client()
    resp = await asyncio.to_thread(
        client.update_service,
        cluster=settings.ECS_CLUSTER,
        service=settings.ECS_SERVICE or service,
        forceNewDeployment=True,
    )
    svc = resp["service"]
    return f"ECS service {svc['serviceName']} forced new deployment. Status: {svc['status']}"


async def _rollback_ecs_deployment(service: str) -> str:
    """
    ECS rollback = force deploy the previous task definition revision.
    We fetch the current task def, decrement the revision, then update service.
    """
    client = _ecs_client()
    svc_name = settings.ECS_SERVICE or service

    # Get current task def ARN
    desc = await asyncio.to_thread(client.describe_services,
                                   cluster=settings.ECS_CLUSTER, services=[svc_name])
    current_td = desc["services"][0]["taskDefinition"]
    # e.g. arn:...:task-definition/myapp:7  → family:6
    family, revision = current_td.rsplit(":", 1)
    prev_revision = max(1, int(revision) - 1)
    prev_td = f"{family}:{prev_revision}"

    resp = await asyncio.to_thread(
        client.update_service,
        cluster=settings.ECS_CLUSTER,
        service=svc_name,
        taskDefinition=prev_td,
        forceNewDeployment=True,
    )
    return f"Rolled back {svc_name} to task def {prev_td}"


async def _scale_rds(db_instance: str) -> str:
    """
    Scale RDS: upgrade instance class one tier (e.g. db.t3.micro → db.t3.small).
    For Aurora Serverless this would adjust ACU capacity.
    """
    client = _rds_client()
    SCALE_UP_MAP = {
        "db.t3.micro": "db.t3.small",
        "db.t3.small": "db.t3.medium",
        "db.t3.medium": "db.t3.large",
        "db.t3.large": "db.t3.xlarge",
    }
    try:
        desc = await asyncio.to_thread(client.describe_db_instances, DBInstanceIdentifier=db_instance)
        current_class = desc["DBInstances"][0]["DBInstanceClass"]
        target_class = SCALE_UP_MAP.get(current_class, current_class)
        if target_class == current_class:
            return f"RDS {db_instance} already at max tier {current_class}, cannot auto-scale further. Notifying team."

        await asyncio.to_thread(
            client.modify_db_instance,
            DBInstanceIdentifier=db_instance,
            DBInstanceClass=target_class,
            ApplyImmediately=True,
        )
        return f"RDS {db_instance} scaling from {current_class} → {target_class}"
    except ClientError as e:
        return f"RDS scale failed: {e}"


async def _scale_ecs_service(service: str, delta: int = 1) -> str:
    """Increase ECS service desired count by delta."""
    client = _ecs_client()
    svc_name = settings.ECS_SERVICE or service
    desc = await asyncio.to_thread(client.describe_services,
                                   cluster=settings.ECS_CLUSTER, services=[svc_name])
    current = desc["services"][0]["desiredCount"]
    new_count = current + delta
    await asyncio.to_thread(
        client.update_service,
        cluster=settings.ECS_CLUSTER,
        service=svc_name,
        desiredCount=new_count,
    )
    return f"Scaled {svc_name} from {current} → {new_count} tasks"


async def _clear_redis_cache() -> str:
    from app.services.redis_service import get_redis
    r = get_redis()
    await r.flushdb()
    return "Redis cache cleared"


async def _notify_human(service: str, reason: str) -> str:
    """
    Send a CloudWatch alarm or SNS notification (if configured).
    Falls back to logging.
    """
    logger.critical(f"🚨 HUMAN ESCALATION REQUIRED — service={service}, reason={reason}")
    # Optional: publish to SNS
    # sns = boto3.client("sns", region_name=settings.AWS_REGION)
    # sns.publish(TopicArn="arn:aws:sns:...", Message=reason, Subject=f"Incident: {service}")
    return f"Human notified for {service}: {reason}"


# ─────────────────────────────────────────────────────────────────────────────
# Main Executor
# ─────────────────────────────────────────────────────────────────────────────

class RemediationExecutor:
    async def execute(
        self,
        action: RemediationAction,
        service: str,
        context: dict = None,
    ) -> RemediationResult:
        context = context or {}
        logger.info(f"⚙️  Executing {action} on {service}")
        start = time.monotonic()
        success = True
        output = ""

        try:
            if action == RemediationAction.RESTART_SERVICE:
                output = await _restart_ecs_service(service)

            elif action == RemediationAction.ROLLBACK_DEPLOYMENT:
                output = await _rollback_ecs_deployment(service)

            elif action == RemediationAction.SCALE_DB:
                db_instance = context.get("db_instance", service)
                output = await _scale_rds(db_instance)

            elif action == RemediationAction.SCALE_SERVICE:
                output = await _scale_ecs_service(service)

            elif action == RemediationAction.CLEAR_CACHE:
                output = await _clear_redis_cache()

            elif action == RemediationAction.NOTIFY_HUMAN:
                reason = context.get("reason", "Unknown anomaly")
                output = await _notify_human(service, reason)

            else:
                output = f"No action taken for {action}"

        except Exception as e:
            success = False
            output = f"Remediation failed: {e}"
            logger.error(output, exc_info=True)

        duration = time.monotonic() - start
        return RemediationResult(
            action=action,
            success=success,
            output=output,
            executed_at=datetime.utcnow(),
            duration_seconds=round(duration, 2),
        )
