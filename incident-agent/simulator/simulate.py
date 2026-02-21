"""
Incident Simulator
Simulates memory leaks, crash loops, and DB saturation for testing.
Can run against a live agent via HTTP, or inject directly into the detection pipeline.
"""
import asyncio
import argparse
import json
import random
import time
from datetime import datetime, timezone
from typing import List

import httpx


BASE_URL = "http://localhost:8000"


# ─────────────────────────────────────────────────────────────────────────────
# Metric generators
# ─────────────────────────────────────────────────────────────────────────────

def gen_memory_leak(service: str, steps: int = 10) -> List[dict]:
    """Gradually increasing memory — simulates a leak."""
    return [
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": service,
            "metric_name": "memory_percent",
            "value": round(55.0 + i * 4.5, 1),  # 55% → 95%+
            "unit": "%",
        }
        for i in range(steps)
    ]


def gen_crash_loop(service: str, steps: int = 5) -> List[dict]:
    """Rising restart count — simulates crash loop."""
    return [
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": service,
            "metric_name": "restart_count",
            "value": i + 1,
            "unit": "count",
        }
        for i in range(steps)
    ]


def gen_db_saturation(service: str, steps: int = 8) -> List[dict]:
    """Rising DB connections — simulates DB saturation."""
    return [
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": service,
            "metric_name": "db_connections",
            "value": round(40 + i * 8 + random.uniform(-2, 2), 0),
            "unit": "count",
        }
        for i in range(steps)
    ]


SCENARIOS = {
    "memory_leak": gen_memory_leak,
    "crash_loop": gen_crash_loop,
    "db_saturation": gen_db_saturation,
}


# ─────────────────────────────────────────────────────────────────────────────
# Runner
# ─────────────────────────────────────────────────────────────────────────────

async def run_simulation(scenario: str, service: str = "test-service", delay: float = 1.0):
    gen = SCENARIOS.get(scenario)
    if not gen:
        print(f"Unknown scenario: {scenario}. Choose from {list(SCENARIOS)}")
        return

    print(f"\n🧪 Simulating [{scenario}] on service [{service}]")
    points = gen(service)

    async with httpx.AsyncClient(timeout=30) as client:
        for i, point in enumerate(points):
            print(f"  [{i+1}/{len(points)}] Pushing {point['metric_name']} = {point['value']}")
            resp = await client.post(f"{BASE_URL}/metrics/ingest", json=[point])
            data = resp.json()
            if data:
                for inc in data:
                    print(f"\n  🚨 INCIDENT TRIGGERED: {inc['incident_id']}")
                    print(f"     Status: {inc['status']}")
                    print(f"     Type:   {inc['incident_type']}")
                    if inc.get("diagnosis"):
                        print(f"     Cause:  {inc['diagnosis']['root_cause'][:80]}...")
                    if inc.get("remediation"):
                        print(f"     Fix:    {inc['remediation']['action']} → {'✅' if inc['remediation']['success'] else '❌'}")
                    if inc.get("verification"):
                        print(f"     Health: {'✅ Recovered' if inc['verification']['healthy'] else '❌ Still unhealthy'}")
            await asyncio.sleep(delay)

    print(f"\n✅ Simulation [{scenario}] complete.")


async def run_all(service: str = "test-service"):
    for scenario in SCENARIOS:
        await run_simulation(scenario, service=f"{service}-{scenario}")
        await asyncio.sleep(3)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Incident Simulator")
    parser.add_argument("--scenario", choices=list(SCENARIOS) + ["all"], default="all")
    parser.add_argument("--service", default="test-service")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between metric pushes")
    parser.add_argument("--url", default=BASE_URL)
    args = parser.parse_args()

    BASE_URL = args.url
    if args.scenario == "all":
        asyncio.run(run_all(args.service))
    else:
        asyncio.run(run_simulation(args.scenario, args.service, args.delay))
