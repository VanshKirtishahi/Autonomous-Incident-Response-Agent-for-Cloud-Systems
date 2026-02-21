# 🤖 AI Incident Agent

An autonomous SRE agent that monitors AWS cloud infrastructure, detects anomalies, diagnoses root cause, executes fixes, verifies recovery, generates reports, and learns from every incident.

---

## 🏗️ Architecture

```
CloudWatch + Docker Logs
        ↓
Log Stream Processor (background task)
        ↓
Anomaly Detector (Threshold → Z-Score → Isolation Forest)
        ↓
Diagnosis Engine (Rules → LLM Reasoning → KB Lookup)
        ↓
Remediation Executor (ECS restart / rollback / RDS scale)
        ↓
Verification Engine (poll until healthy, retry with backoff)
        ↓
Incident Reporter (Markdown + JSON)
        ↓
Learning Engine (MongoDB + ChromaDB vector KB)
```

---

## ⚡ Quick Start

### 1. Clone & configure
```bash
cp .env.example .env
# Fill in your AWS credentials, OpenAI key, etc.
```

### 2. Start all services
```bash
docker-compose up --build
```

Services started:
| Service | URL |
|---------|-----|
| AI Agent API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| Grafana | http://localhost:3000 |
| Prometheus | http://localhost:9090 |

### 3. Run a simulation
```bash
# Simulate all 3 incident types
python simulator/simulate.py --scenario all

# Single scenario
python simulator/simulate.py --scenario memory_leak --service my-app
python simulator/simulate.py --scenario crash_loop --service my-app
python simulator/simulate.py --scenario db_saturation --service my-app
```

---

## 🧩 Supported Incident Types

| Type | Trigger | Auto-Fix |
|------|---------|----------|
| `memory_leak` | memory > 85% | ECS force new deployment (restart) |
| `crash_loop` | restarts > 3 | ECS rollback to previous task def |
| `db_saturation` | db_connections > 80 | RDS instance class scale-up |
| `cpu_spike` | cpu > 85% | ECS scale out (add tasks) |
| `unknown` | ML anomaly | Human escalation via logs/SNS |

---

## 🔍 Detection Layers

1. **Threshold** — instant, deterministic, catches obvious breaches
2. **Z-Score** — statistical, catches drift from historical baseline
3. **Isolation Forest** — ML, catches novel patterns not covered by rules

---

## 📡 API Reference

### Inject metrics manually
```bash
curl -X POST http://localhost:8000/metrics/ingest \
  -H "Content-Type: application/json" \
  -d '[{"service":"my-app","metric_name":"memory_percent","value":92.5,"unit":"%"}]'
```

### Simulate incident via API
```bash
curl -X POST "http://localhost:8000/incidents/simulate?service=my-app&incident_type=memory_leak"
```

### List incidents
```bash
curl http://localhost:8000/incidents/
```

### Get incident + timeline
```bash
curl http://localhost:8000/incidents/INC-XXXXXXXX
curl http://localhost:8000/incidents/INC-XXXXXXXX/timeline
```

### View knowledge base
```bash
curl http://localhost:8000/learning/
```

### List generated reports
```bash
curl http://localhost:8000/reports/
```

---

## 🏆 Demo Flow (Hackathon)

```
1. docker-compose up
2. python simulator/simulate.py --scenario memory_leak
3. Watch terminal: detection → diagnosis → remediation → verification
4. Open http://localhost:8000/incidents/ — see full incident JSON
5. Open http://localhost:8000/reports/ — download Markdown report
6. Run again — notice higher confidence from KB learning
```

---

## 📁 Project Structure

```
incident-agent/
├── app/
│   ├── main.py                  # FastAPI app entry point
│   ├── models/schemas.py        # Pydantic models (Incident, Signal, etc.)
│   ├── engines/
│   │   ├── detector.py          # 3-layer anomaly detection
│   │   ├── diagnosis.py         # Rule + LLM root cause analysis
│   │   ├── executor.py          # AWS remediation actions
│   │   ├── verifier.py          # Health verification with retry
│   │   ├── reporter.py          # Markdown + JSON report generation
│   │   └── learning.py          # MongoDB + ChromaDB knowledge base
│   ├── services/
│   │   ├── orchestrator.py      # Full incident lifecycle coordinator
│   │   ├── log_stream.py        # Background log ingestion
│   │   ├── redis_service.py     # Cache + real-time timeline stream
│   │   └── mongodb_service.py   # Persistent incident + KB storage
│   ├── routes/
│   │   ├── incidents.py         # Incident CRUD + simulate endpoint
│   │   ├── metrics.py           # Metric ingestion endpoint
│   │   ├── reports.py           # Report retrieval
│   │   ├── health.py            # Health + readiness checks
│   │   └── learning.py          # Knowledge base viewer
│   └── utils/config.py          # Settings from .env
├── collectors/
│   ├── aws_logs.py              # CloudWatch logs + metrics
│   └── docker_logs.py           # Docker container stats
├── simulator/
│   └── simulate.py              # Test incident generator
├── infrastructure/
│   ├── nginx.conf
│   └── prometheus.yml
├── reports/                     # Auto-generated incident reports
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

---

## 🔧 AWS Setup Checklist

- [ ] IAM role/user with: `CloudWatchLogsReadOnlyAccess`, `AmazonEC2ReadOnlyAccess`, `AmazonECS_FullAccess`, `AmazonRDSFullAccess`
- [ ] CloudWatch Log Group created: `/incident-agent/app-logs`
- [ ] ECS Cluster + Service configured in `.env`
- [ ] RDS instance identifier set if using DB saturation remediation
- [ ] EC2 instance ID set for CPU metrics

---

## 🧠 Learning Engine

After each resolved incident, the agent stores:
- Pattern description (natural language)
- Successful action taken
- Vector embedding (via sentence-transformers)

Future similar incidents use semantic search (ChromaDB) to recall past solutions, boosting confidence and potentially overriding the default action with a battle-tested one.
