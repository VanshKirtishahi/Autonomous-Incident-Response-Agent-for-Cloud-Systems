# ⚡ CloudGuard AI — Autonomous Incident Response Agent

> **An expert-level AI agent that monitors cloud infrastructure in real-time, autonomously diagnoses root causes, executes remediation playbooks, rolls back failed fixes, and continuously learns from every incident.**

<div align="center">

![Tech Stack](https://img.shields.io/badge/Stack-MERN-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-010101?style=for-the-badge&logo=socket.io)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Incident Types Handled](#-incident-types-handled)
- [Docker Image Rollback System](#-docker-image-rollback-system)
- [AI Agent Workflow](#-ai-agent-workflow)
- [Knowledge Base Learning](#-knowledge-base-learning)
- [Dashboard Overview](#-dashboard-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Manual Run (Without Docker)](#-manual-run-without-docker)
- [API Reference](#-api-reference)
- [WebSocket Events](#-websocket-events)
- [Simulation Guide](#-simulation-guide)
- [Dummy Data Overview](#-dummy-data-overview)
- [Team Guide](#-team-guide)

---

## 🌟 Overview

CloudGuard AI is a production-grade **Autonomous Incident Response Agent** built on the MERN stack. It solves one of the most expensive problems in DevOps: **cloud outages cost enterprises $5,600/minute on average**, and on-call engineers are often woken up at 3 AM to manually diagnose issues that follow repeatable patterns.

This system demonstrates how an AI agent can:

1. **Detect** anomalies in real-time from simulated Docker container logs and metrics
2. **Diagnose** root causes by correlating logs, metrics, and traces
3. **Remediate** automatically using curated playbooks
4. **Validate** recovery before closing the incident
5. **Rollback** to a previous Docker image if a fix fails validation
6. **Learn** by proposing new runbook entries after every incident

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLOUDGUARD AI SYSTEM                        │
├─────────────────┬───────────────────────────┬───────────────────────┤
│   FRONTEND      │       BACKEND              │     DATABASE          │
│  React 18       │    Express + Node.js       │     MongoDB           │
│  Socket.IO      │    Socket.IO Server        │                       │
│  Recharts       │    IncidentAgent Class     │  Collections:         │
│  React Router   │    REST API                │  - incidents          │
│                 │    Cron Jobs               │  - containers         │
│  Pages:         │                            │  - logs               │
│  - Dashboard    │  Services:                 │  - knowledge          │
│  - Incidents    │  - IncidentAgent.js        │  - metrics            │
│  - Containers   │  - Log Generator           │                       │
│  - Live Logs    │  - Metrics Stream          │                       │
│  - Playbooks    │  - Rollback Manager        │                       │
│  - Knowledge    │  - KB Learner              │                       │
└─────────────────┴───────────────────────────┴───────────────────────┘

Real-time communication: Socket.IO WebSocket events
REST communication: Axios HTTP client → Express routes
```

---

## ✨ Features

### 🔴 Core Incident Response

| Feature | Description |
|---|---|
| **Real-time Detection** | Continuous monitoring of container logs and metrics with anomaly scoring |
| **AI Root Cause Analysis** | Automated diagnosis with confidence scores, impact assessment, and recommendations |
| **Autonomous Remediation** | Executes multi-step playbooks without human intervention |
| **Recovery Verification** | Validates system health before closing incidents |
| **Timestamped Audit Trail** | Every action logged with timestamps, outputs, and durations |

### 🔄 Docker Rollback System

| Feature | Description |
|---|---|
| **Post-fix Validation** | After applying a fix, the agent runs health checks against the new deployment |
| **Automatic Rollback** | If validation fails, the previous Docker image is automatically redeployed |
| **Image Version Tracking** | Every container tracks `currentImage` and `previousImage` |
| **Rollback Notification** | Real-time WebSocket alerts when rollback is triggered and completed |
| **Rollback Audit** | Incidents record `rollbackTriggered`, `rollbackReason`, and restored image |

### 📚 Knowledge Base Learning

| Feature | Description |
|---|---|
| **Auto-proposal** | After every resolved incident, the agent proposes a new KB entry |
| **AI-Generated Content** | Entries include problem summary, solution, triggers, and estimated metrics |
| **Approval Workflow** | Proposed entries require human approval before being promoted |
| **Success Tracking** | Each entry tracks usage count, success rate, and average resolution time |
| **Source Linking** | KB entries reference the source incident for traceability |

### 📊 Dashboard Features

| Feature | Description |
|---|---|
| **Live Metrics Stream** | Real-time CPU, memory, latency charts updating every 3 seconds |
| **Incident Timeline** | All incidents with severity, status, duration, and rollback flags |
| **Container Health Monitor** | Per-container CPU/memory bars with live updates |
| **Log Terminal** | Real-time scrolling log viewer with anomaly highlighting |
| **Playbook Viewer** | Visual step-by-step execution status of active playbooks |
| **Toast Notifications** | Real-time alerts for incidents, resolutions, rollbacks, KB proposals |

---

## 🚨 Incident Types Handled

### 1. 💾 Memory Leak
- **Patterns Detected:** `OutOfMemoryError`, `Java heap space`, `OOM killer`, `RSS growing`
- **Root Cause Analysis:** Heap growth pattern, unbounded cache detection, GC pressure
- **Playbook Steps:** Identify containers → Capture heap dump → Scale horizontal → Rolling restart → Verify → Alert team
- **Severity:** Critical

### 2. 🔄 Pod Crash Loop
- **Patterns Detected:** `CrashLoopBackOff`, `exit code 137`, `nil pointer dereference`, liveness probe failures
- **Root Cause Analysis:** Startup failure, missing ConfigMap keys, dependency unavailability
- **Playbook Steps:** Detect crash pattern → Check dependencies → Rollback deployment → Verify stability → Update probes → Create ticket
- **Severity:** Critical | **Rollback Likely**

### 3. 🗄️ DB Connection Saturation
- **Patterns Detected:** `connection pool exhausted`, `max_connections`, `FATAL: remaining slots`, idle connection leak
- **Root Cause Analysis:** Connection leak source, long-running transactions, pool configuration
- **Playbook Steps:** Analyze pool → Kill idle connections → Identify hogs → Scale PgBouncer → Tune settings → Verify
- **Severity:** High

### 4. 🔥 High CPU Spike
- **Patterns Detected:** `CPU throttling`, `cpu limit exceeded`, `system load high`, thread pool exhaustion
- **Root Cause Analysis:** Infinite loops, recursive calls, thread deadlocks, runaway processes
- **Playbook Steps:** CPU profile → Find runaway process → Set limits → Horizontal scale → Verify
- **Severity:** High

### 5. 🌐 Network Latency Spike
- **Patterns Detected:** `ETIMEDOUT`, `circuit breaker OPEN`, packet loss, DNS failures, latency >2s
- **Root Cause Analysis:** Service mesh issues, DNS congestion, ingress overload, network partition
- **Playbook Steps:** Trace network path → Check service mesh → Restart ingress → Flush DNS → Verify
- **Severity:** Medium

### 6. 💿 Disk Pressure
- **Patterns Detected:** `ENOSPC`, `No space left on device`, inode exhaustion, volume full
- **Root Cause Analysis:** Log accumulation, core dump buildup, debug logging enabled in production
- **Playbook Steps:** Identify disk hogs → Rotate logs → Clean temp files → Expand PVC → Verify
- **Severity:** High

---

## 🔄 Docker Image Rollback System

```
              Fix Applied
                  │
                  ▼
         ┌─────────────────┐
         │  Health Check   │
         │  Validation     │
         └────────┬────────┘
                  │
         ┌────────┴────────┐
         │                 │
       PASS               FAIL
         │                 │
         ▼                 ▼
   ┌──────────┐    ┌──────────────────┐
   │ Incident │    │ ROLLBACK         │
   │ RESOLVED │    │ TRIGGERED        │
   └──────────┘    │                  │
                   │ Redeploy:        │
                   │ previousImage    │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
                   │ Container        │
                   │ Restored &       │
                   │ Healthy          │
                   └──────────────────┘
```

**Every container in the system tracks two image fields:**
```json
{
  "image": "myapp/payment-service:v3.1.0",      ← current
  "previousImage": "myapp/payment-service:v3.0.9" ← rollback target
}
```

When a fix fails validation (currently simulated at 30% probability for POD_CRASH_LOOP scenarios), the system:
1. Emits `rollback:triggered` WebSocket event
2. Sets container status to `rolling_back`  
3. Waits 3 seconds (simulating redeploy time)
4. Restores `image = previousImage`
5. Sets container `status = running`, `healthStatus = healthy`
6. Emits `rollback:completed` event
7. Marks incident as `rolled_back` with reason and restored image

---

## 🤖 AI Agent Workflow

```
START MONITORING
     │
     ▼
┌──────────────┐
│   DETECT     │ ← Analyze logs for error patterns
│   Phase      │   Score anomalies (0-100)
└──────┬───────┘   Match against known signatures
       │
       ▼
┌──────────────┐
│  DIAGNOSE    │ ← Correlate logs + metrics + traces
│  Phase       │   Generate root cause hypothesis
└──────┬───────┘   Calculate confidence score
       │
       ▼
┌──────────────┐
│  REMEDIATE   │ ← Select matching playbook
│  Phase       │   Execute steps sequentially
└──────┬───────┘   Log each action with timestamps
       │
       ▼
┌──────────────┐
│   VERIFY     │ ← Run health checks
│   Phase      │   Check metrics against baseline
└──────┬───────┘
       │
    ┌──┴──┐
  PASS  FAIL
    │     │
    ▼     ▼
RESOLVE  ROLLBACK
    │     │
    └──┬──┘
       │
       ▼
┌──────────────┐
│   LEARN      │ ← Generate KB proposal
│   Phase      │   Record metrics, patterns, solution
└──────────────┘
```

---

## 📚 Knowledge Base Learning

The system implements an **auto-growing knowledge base** with three tiers:

| Tier | Creator | Color | Approval |
|------|---------|-------|----------|
| `manual` | Human engineers | 🔵 Blue | Auto-approved |
| `agent` | Agent (pre-defined) | 🟦 Cyan | Auto-approved |
| `learned` | AI from resolved incidents | 🟣 Purple | **Requires review** |

**Learned entries include:**
- Problem description (from AI analysis summary)
- Solution recommendation
- Trigger patterns (top 3 from matched incident type)
- Success rate estimate
- Source incident ID for traceability
- Tags (service name, incident type, "auto-generated")

---

## 📊 Dashboard Overview

### `/` — Operations Dashboard
- 4 KPI stat cards: Total, Active, Resolved, Avg Resolution Time
- Active incident banners with live status
- System metrics area chart (CPU + Memory, live update)
- Incident distribution pie chart
- Recent incidents list
- Rollback count and KB proposal count cards

### `/incidents` — Incident Log
- Filterable incident list (status, severity)
- Click any incident to see full detail panel:
  - AI root cause analysis with confidence score
  - Estimated user impact
  - Rollback information (if triggered)
  - Playbook execution timeline with step outputs

### `/containers` — Container Monitor  
- Grid of all 8 Docker containers
- Real-time CPU and memory progress bars
- Container status (running / rolling_back / crashed)
- Current and previous image versions
- Restart count, replica count, uptime

### `/logs` — Live Log Stream
- Terminal-style scrolling log viewer
- Filter by: level (DEBUG/INFO/WARN/ERROR/FATAL), service, anomaly-only
- Anomaly entries highlighted in red
- Auto-scrolls to latest entries

### `/playbooks` — Remediation Playbooks
- All 6 playbooks with success rate, step count, average resolution time
- Click any playbook to see detailed step breakdown
- Rollback protection note on each playbook

### `/knowledge` — Knowledge Base
- All KB entries with creation source badge
- Filter by category or creator type
- One-click approval for AI-learned entries
- Problem/solution side-by-side view
- Usage statistics and success rate

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20 | Runtime |
| Express.js | 4.18 | REST API framework |
| Socket.IO | 4.6 | Real-time WebSocket events |
| Mongoose | 8.0 | MongoDB ODM |
| node-cron | 3.0 | Scheduled tasks |
| uuid | 9.0 | Unique ID generation |
| cors | 2.8 | Cross-origin requests |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.2 | UI framework |
| React Router | 6.20 | Client-side routing |
| Socket.IO Client | 4.6 | Real-time updates |
| Recharts | 2.10 | Charts and visualizations |
| Axios | 1.6 | HTTP client |
| Lucide React | 0.294 | Icon library |
| date-fns | 3.0 | Date formatting |

### Infrastructure
| Technology | Purpose |
|---|---|
| MongoDB 7.0 | Primary database |
| Docker + Compose | Containerization |
| Nginx | Frontend serving + reverse proxy |

---

## 📁 Project Structure

```
cloud-agent/
├── docker-compose.yml              # Full stack orchestration
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js                # Express server + Socket.IO
│       ├── models/
│       │   └── index.js            # Mongoose schemas
│       │       ├── Incident
│       │       ├── Container
│       │       ├── Log
│       │       ├── Knowledge
│       │       └── Metrics
│       ├── routes/
│       │   └── api.js              # All REST endpoints
│       ├── services/
│       │   └── IncidentAgent.js    # Core AI agent logic
│       └── data/
│           └── dummyData.js        # All simulation data
│
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── index.js                # React entry point
        └── App.jsx                 # Complete application
            ├── Dashboard           # KPIs, charts, recent incidents
            ├── IncidentsPage       # Incident list + detail panel
            ├── ContainersPage      # Docker container grid
            ├── LogsPage            # Live log terminal
            ├── PlaybooksPage       # Playbook browser
            └── KnowledgePage       # KB management
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Ports 3000, 5000, 27017 available

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cloud-agent
```

### 2. Start with Docker Compose
```bash
docker-compose up --build
```

### 3. Access the Dashboard
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

### 4. First Simulation
1. Open http://localhost:3000
2. Click **"Simulate Incident"** in the top-right
3. Select an incident type (e.g., `Memory Leak Detected`)
4. Click **"Launch Simulation"**
5. Watch the agent detect → diagnose → remediate in real-time!

> ⏱️ Incidents auto-simulate every 2-4 minutes. The first auto-simulation starts 30 seconds after startup.

---

## 💻 Manual Run (Without Docker)

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

Frontend will be on http://localhost:3000, backend on http://localhost:5000.

---

## 📡 API Reference

### Incidents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/incidents` | List all incidents (supports `?status=`, `?severity=`, `?limit=`, `?page=`) |
| `GET` | `/api/incidents/:id` | Get single incident with full detail |
| `POST` | `/api/incidents/trigger` | Manually trigger an incident simulation |
| `GET` | `/api/incidents/stats/summary` | Dashboard statistics |

**POST /api/incidents/trigger Body:**
```json
{
  "type": "MEMORY_LEAK",
  "containerId": "c1f3a8b2d4e9"
}
```

**Incident Types:**
- `MEMORY_LEAK`
- `POD_CRASH_LOOP`
- `DB_CONNECTION_SATURATION`
- `HIGH_CPU`
- `NETWORK_LATENCY`
- `DISK_PRESSURE`

### Containers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/containers` | List all containers |
| `GET` | `/api/containers/:id` | Get single container |

### Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/logs` | Get logs (supports `?service=`, `?level=`, `?incidentId=`, `?anomalyOnly=true`) |

### Knowledge Base

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/knowledge` | List all KB entries |
| `PATCH` | `/api/knowledge/:id/approve` | Approve a pending KB entry |

### Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/metrics` | Get metrics history |
| `GET` | `/api/metrics/current` | Get latest metrics per service |

### Agent Control

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/agent/start` | Start monitoring |
| `POST` | `/api/agent/stop` | Stop monitoring |
| `GET` | `/api/agent/status` | Get agent status |
| `GET` | `/api/incident-types` | List all incident types |

---

## 📡 WebSocket Events

### Server → Client (Subscribe)

| Event | Payload | Description |
|-------|---------|-------------|
| `incident:detected` | `{incidentId, type, title, severity, service, container, image}` | New incident started |
| `incident:status` | `{incidentId, status}` | Status changed |
| `incident:diagnosed` | `{incidentId, analysis}` | AI diagnosis complete |
| `incident:resolved` | `{incidentId, duration, type}` | Incident resolved |
| `playbook:step` | `{incidentId, step, action, status, output}` | Playbook step update |
| `rollback:triggered` | `{incidentId, container, currentImage, previousImage, reason}` | Rollback started |
| `rollback:completed` | `{incidentId, container, restoredImage}` | Rollback finished |
| `log:new` | `{containerId, containerName, service, level, message, timestamp, isAnomaly}` | New log entry |
| `metrics:update` | `{service, cpu, memory, networkLatency, errorRate, ...}` | Live metrics |
| `container:updated` | `{containerId, status, image, healthStatus}` | Container state change |
| `knowledge:proposed` | `{knowledgeId, title, incidentId}` | New KB entry proposed |

### Client → Server (Emit)

| Event | Payload | Description |
|-------|---------|-------------|
| `trigger:incident` | `{type, containerId}` | Manually trigger incident |

---

## 🎮 Simulation Guide

### Triggering Incidents via UI
1. Click **"Simulate Incident"** button in top navbar
2. Select incident type from dropdown
3. Select target container (or leave Random)
4. Click **"Launch Simulation"**

### Triggering via API
```bash
# Memory leak on api-gateway
curl -X POST http://localhost:5000/api/incidents/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "MEMORY_LEAK", "containerId": "c1f3a8b2d4e9"}'

# Random pod crash loop
curl -X POST http://localhost:5000/api/incidents/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "POD_CRASH_LOOP"}'

# DB connection saturation on postgres
curl -X POST http://localhost:5000/api/incidents/trigger \
  -H "Content-Type: application/json" \
  -d '{"type": "DB_CONNECTION_SATURATION", "containerId": "f7b4d2e8a1c5"}'
```

### Auto-Simulation
Incidents auto-simulate every 2–4 minutes after startup (starting at 30s). This simulates a production environment with organic incident arrival. You can stop this via the **"Stop Agent"** button.

### Observing Rollback
Rollbacks are triggered ~30% of the time for `POD_CRASH_LOOP` incidents. To guarantee seeing a rollback:
1. Trigger multiple `POD_CRASH_LOOP` incidents
2. Watch for the yellow `ROLLBACK` badge in the incident list
3. Monitor the container status changing to `rolling_back` on the Containers page
4. See the toast notification and the restored image version

---

## 📦 Dummy Data Overview

### Simulated Docker Containers (8 services)

| Container | Image | Service |
|-----------|-------|---------|
| api-gateway | myapp/api-gateway:v2.3.1 | API Gateway |
| user-service | myapp/user-service:v1.8.2 | User Management |
| payment-service | myapp/payment-service:v3.1.0 | Payments |
| notification-service | myapp/notification-service:v1.2.0 | Notifications |
| order-service | myapp/order-service:v2.0.5 | Order Processing |
| postgres-db | postgres:14.5 | Database |
| redis-cache | redis:7.2 | Cache |
| inventory-service | myapp/inventory-service:v1.5.3 | Inventory |

### Metrics Baseline (Normal Ranges)

| Metric | Normal Range | Incident Spike |
|--------|-------------|----------------|
| CPU | 15–35% | 85–99% |
| Memory | 30–65% | 85–99% |
| Network Latency | 45–180ms | 800–3000ms |
| DB Connections | 10–45 | 90–100 |
| Error Rate | 0.01–0.5% | 20–65% |
| Requests/sec | 120–450 | 890+ |
| Disk Usage | 35–65% | 87–99% |

### Pre-seeded Historical Data
- **8 historical incidents** across different types and services
- **60 minutes** of historical metrics for all services
- **3 initial knowledge base** entries (manually created)

---

## 👥 Team Guide

### For Backend Engineers
- The core agent logic lives in `backend/src/services/IncidentAgent.js`
- Add new incident types in `backend/src/data/dummyData.js` (incidentTypes, logTemplates, aiAnalysis)
- WebSocket events are emitted via `this.io.emit()` in the agent class
- All MongoDB models are in `backend/src/models/index.js`

### For Frontend Engineers  
- All pages are in `frontend/src/App.jsx` (single-file architecture for simplicity)
- CSS variables are defined in the `GlobalStyles` component at the top
- Socket.IO subscriptions are in the root `App` component's `useEffect`
- To add a new page: add a route in `Routes`, add a nav item in `Sidebar.navItems`

### For DevOps Engineers
- Docker Compose orchestrates all 3 services (mongo, backend, frontend)
- Nginx reverse proxy handles `/api` and `/socket.io` proxying
- MongoDB data persists via the `mongo_data` Docker volume
- Backend auto-seeds data on first startup (no migrations needed)

### Extending the System
1. **New Incident Type:** Add to `incidentTypes`, `logTemplates`, `aiAnalysis` in `dummyData.js`
2. **New Playbook Step:** Add to the `playbook` array of an incident type
3. **New Container:** Add to `dockerContainers` array
4. **Custom KB Entry:** POST to `/api/knowledge` with the knowledge schema
5. **New Dashboard Widget:** Add a card component and subscribe to relevant WebSocket events

---

## 📜 License

MIT License — Free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ for the DevOps community**

*"The best incident is the one resolved before anyone notices."*

</div>
