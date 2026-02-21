// Simulated Docker containers/services
const dockerContainers = [
  {
    id: "c1f3a8b2d4e9",
    name: "api-gateway",
    image: "myapp/api-gateway:v2.3.1",
    previousImage: "myapp/api-gateway:v2.3.0",
    status: "running",
    uptime: "14d 3h",
    cpu: 23,
    memory: 512,
    memoryLimit: 1024,
    restarts: 0,
    service: "api-gateway",
    replicas: 3
  },
  {
    id: "b2e7c9a1f5d3",
    name: "user-service",
    image: "myapp/user-service:v1.8.2",
    previousImage: "myapp/user-service:v1.8.1",
    status: "running",
    uptime: "7d 12h",
    cpu: 18,
    memory: 256,
    memoryLimit: 512,
    restarts: 2,
    service: "user-service",
    replicas: 2
  },
  {
    id: "a9d4f2e8c6b1",
    name: "payment-service",
    image: "myapp/payment-service:v3.1.0",
    previousImage: "myapp/payment-service:v3.0.9",
    status: "running",
    uptime: "3d 6h",
    cpu: 45,
    memory: 768,
    memoryLimit: 1024,
    restarts: 0,
    service: "payment-service",
    replicas: 4
  },
  {
    id: "d5c8b1a7e3f9",
    name: "notification-service",
    image: "myapp/notification-service:v1.2.0",
    previousImage: "myapp/notification-service:v1.1.9",
    status: "running",
    uptime: "21d 8h",
    cpu: 8,
    memory: 128,
    memoryLimit: 256,
    restarts: 0,
    service: "notification-service",
    replicas: 2
  },
  {
    id: "e6a3c9f1d2b8",
    name: "order-service",
    image: "myapp/order-service:v2.0.5",
    previousImage: "myapp/order-service:v2.0.4",
    status: "running",
    uptime: "5d 2h",
    cpu: 35,
    memory: 384,
    memoryLimit: 512,
    restarts: 1,
    service: "order-service",
    replicas: 3
  },
  {
    id: "f7b4d2e8a1c5",
    name: "postgres-db",
    image: "postgres:14.5",
    previousImage: "postgres:14.4",
    status: "running",
    uptime: "30d 1h",
    cpu: 55,
    memory: 2048,
    memoryLimit: 4096,
    restarts: 0,
    service: "postgres-db",
    replicas: 1
  },
  {
    id: "g8c5e3f9b2d6",
    name: "redis-cache",
    image: "redis:7.2",
    previousImage: "redis:7.1",
    status: "running",
    uptime: "30d 1h",
    cpu: 12,
    memory: 512,
    memoryLimit: 1024,
    restarts: 0,
    service: "redis-cache",
    replicas: 1
  },
  {
    id: "h9d6f4a2c7e1",
    name: "inventory-service",
    image: "myapp/inventory-service:v1.5.3",
    previousImage: "myapp/inventory-service:v1.5.2",
    status: "running",
    uptime: "9d 14h",
    cpu: 28,
    memory: 320,
    memoryLimit: 512,
    restarts: 3,
    service: "inventory-service",
    replicas: 2
  }
];

// Incident types with playbooks
const incidentTypes = {
  MEMORY_LEAK: {
    name: "Memory Leak Detected",
    severity: "critical",
    patterns: ["OutOfMemoryError", "java.lang.OutOfMemory", "Killed process", "memory pressure", "OOM killer"],
    rootCausePatterns: ["heap space", "GC overhead", "memory allocation failed", "RSS growing"],
    playbook: [
      { step: 1, action: "identify_affected_containers", description: "Scan all containers for memory anomalies", duration: 800 },
      { step: 2, action: "capture_heap_dump", description: "Capture heap dump for post-mortem analysis", duration: 1200 },
      { step: 3, action: "scale_horizontal", description: "Scale horizontally to distribute memory load", duration: 2000 },
      { step: 4, action: "restart_affected_pods", description: "Rolling restart of affected pods to release memory", duration: 3000 },
      { step: 5, action: "verify_memory_normal", description: "Verify memory usage returns to baseline (<80%)", duration: 1500 },
      { step: 6, action: "alert_dev_team", description: "Alert development team with heap dump for analysis", duration: 500 }
    ]
  },
  POD_CRASH_LOOP: {
    name: "Pod Crash Loop",
    severity: "critical",
    patterns: ["CrashLoopBackOff", "Error response from daemon", "container exited", "exit code 1", "exit code 137", "OOMKilled"],
    rootCausePatterns: ["segmentation fault", "panic:", "fatal error", "config missing", "dependency unavailable"],
    playbook: [
      { step: 1, action: "detect_crash_pattern", description: "Analyze crash logs to identify root cause", duration: 1000 },
      { step: 2, action: "check_dependencies", description: "Verify all service dependencies are healthy", duration: 800 },
      { step: 3, action: "rollback_deployment", description: "Rollback to previous stable image version", duration: 4000 },
      { step: 4, action: "verify_pod_stability", description: "Monitor pod stability for 60 seconds post-rollback", duration: 2500 },
      { step: 5, action: "update_liveness_probe", description: "Adjust liveness probe thresholds to prevent false kills", duration: 600 },
      { step: 6, action: "create_incident_ticket", description: "Create P1 ticket for engineering review", duration: 400 }
    ]
  },
  DB_CONNECTION_SATURATION: {
    name: "DB Connection Pool Exhausted",
    severity: "high",
    patterns: ["connection pool exhausted", "too many connections", "FATAL: remaining connection slots", "connection timeout", "max_connections"],
    rootCausePatterns: ["connection leak", "slow queries", "deadlock", "long-running transaction", "connection not closed"],
    playbook: [
      { step: 1, action: "analyze_connection_pool", description: "Query pg_stat_activity for active connections", duration: 700 },
      { step: 2, action: "kill_idle_connections", description: "Terminate idle connections older than 300s", duration: 1500 },
      { step: 3, action: "identify_connection_hogs", description: "Identify top connection consumers by service", duration: 900 },
      { step: 4, action: "scale_pgbouncer", description: "Scale PgBouncer connection pooler instances", duration: 2500 },
      { step: 5, action: "tune_pool_settings", description: "Adjust pool_size and max_overflow settings", duration: 1200 },
      { step: 6, action: "verify_connections_normal", description: "Verify connection count below 80% threshold", duration: 1000 }
    ]
  },
  HIGH_CPU: {
    name: "CPU Spike / Runaway Process",
    severity: "high",
    patterns: ["CPU throttling", "cpu limit exceeded", "system load high", "cpu usage 95%", "kernel: CPU"],
    rootCausePatterns: ["infinite loop", "recursive call", "thread deadlock", "garbage collection", "cryptominer"],
    playbook: [
      { step: 1, action: "profile_cpu_usage", description: "Capture CPU profile and identify hot threads", duration: 1000 },
      { step: 2, action: "check_for_runaway_process", description: "Identify processes consuming >80% CPU", duration: 600 },
      { step: 3, action: "set_cpu_limits", description: "Apply CPU request/limit constraints to pod", duration: 800 },
      { step: 4, action: "horizontal_scale", description: "Scale service replicas to distribute CPU load", duration: 2000 },
      { step: 5, action: "verify_cpu_normal", description: "Confirm CPU usage drops below 70%", duration: 1200 }
    ]
  },
  NETWORK_LATENCY: {
    name: "Network Latency Spike",
    severity: "medium",
    patterns: ["timeout", "connection refused", "network unreachable", "latency spike", "packet loss", "ETIMEDOUT"],
    rootCausePatterns: ["network partition", "DNS failure", "service mesh issue", "ingress overload", "MTU mismatch"],
    playbook: [
      { step: 1, action: "trace_network_path", description: "Run traceroute and measure hop latencies", duration: 1500 },
      { step: 2, action: "check_service_mesh", description: "Inspect Istio/Envoy metrics for anomalies", duration: 900 },
      { step: 3, action: "restart_ingress_controller", description: "Rolling restart of ingress controller pods", duration: 2000 },
      { step: 4, action: "flush_dns_cache", description: "Flush DNS cache on affected nodes", duration: 600 },
      { step: 5, action: "verify_latency_normal", description: "Confirm p99 latency returns to <200ms baseline", duration: 1000 }
    ]
  },
  DISK_PRESSURE: {
    name: "Disk Pressure / Storage Full",
    severity: "high",
    patterns: ["No space left on device", "disk pressure", "ENOSPC", "inode exhaustion", "volume full"],
    rootCausePatterns: ["log accumulation", "core dumps", "large temp files", "pvc full"],
    playbook: [
      { step: 1, action: "identify_disk_hogs", description: "Find directories consuming most disk space", duration: 800 },
      { step: 2, action: "rotate_logs", description: "Force log rotation and compress old logs", duration: 1500 },
      { step: 3, action: "clean_temp_files", description: "Remove temporary files and core dumps", duration: 1200 },
      { step: 4, action: "expand_pvc", description: "Expand PersistentVolumeClaim by 50GB", duration: 3000 },
      { step: 5, action: "verify_disk_normal", description: "Confirm disk usage below 75%", duration: 800 }
    ]
  }
};

// Log templates for different incident types
const logTemplates = {
  MEMORY_LEAK: [
    { level: "WARN", msg: "Memory usage at 78% - monitoring threshold reached" },
    { level: "WARN", msg: "GC pause duration 2.3s - heap pressure increasing" },
    { level: "ERROR", msg: "java.lang.OutOfMemoryError: Java heap space at com.myapp.cache.SessionCache.put(SessionCache.java:234)" },
    { level: "ERROR", msg: "RSS memory growing: 850MB (limit: 1024MB) - OOM killer may activate" },
    { level: "FATAL", msg: "Process killed by OOM killer - memory limit 1024MB exceeded (current: 1087MB)" },
    { level: "ERROR", msg: "Container restarting due to memory exhaustion - restart count: 3" }
  ],
  POD_CRASH_LOOP: [
    { level: "ERROR", msg: "Container exited with exit code 137 (SIGKILL)" },
    { level: "ERROR", msg: "CrashLoopBackOff - container has been restarting 5 times in 10 minutes" },
    { level: "FATAL", msg: "panic: runtime error: invalid memory address or nil pointer dereference" },
    { level: "ERROR", msg: "Liveness probe failed: HTTP probe failed with statuscode: 500" },
    { level: "ERROR", msg: "Back-off restarting failed container - waiting 5 minutes before retry" },
    { level: "WARN", msg: "Dependency check failed: unable to reach postgres-db:5432 - connection refused" }
  ],
  DB_CONNECTION_SATURATION: [
    { level: "WARN", msg: "Connection pool at 85% capacity (85/100 connections in use)" },
    { level: "ERROR", msg: "FATAL: remaining connection slots are reserved for non-replication superuser connections" },
    { level: "ERROR", msg: "connection pool exhausted - request queued (queue depth: 47)" },
    { level: "ERROR", msg: "Query timeout after 30000ms - connection not available from pool" },
    { level: "WARN", msg: "Detected 23 idle connections older than 5 minutes - possible connection leak" },
    { level: "ERROR", msg: "max_connections=100 reached - new connections being refused" }
  ],
  HIGH_CPU: [
    { level: "WARN", msg: "CPU usage at 89% - approaching throttle limit" },
    { level: "ERROR", msg: "CPU throttling detected - container throttled for 2.3s in last 5s" },
    { level: "WARN", msg: "Thread pool exhausted - 500 threads active (limit: 500)" },
    { level: "ERROR", msg: "Request processing time: 8.5s (SLA: 2s) - CPU contention detected" },
    { level: "ERROR", msg: "System load average: 15.2 (cores: 4) - critical overload" }
  ],
  NETWORK_LATENCY: [
    { level: "WARN", msg: "P99 latency spike: 2300ms (baseline: 180ms)" },
    { level: "ERROR", msg: "ETIMEDOUT: connect to payment-service:8080 - timeout after 5000ms" },
    { level: "ERROR", msg: "Service mesh sidecar reporting 40% packet loss to upstream" },
    { level: "WARN", msg: "DNS resolution taking 800ms - possible DNS congestion" },
    { level: "ERROR", msg: "Circuit breaker OPEN for payment-service - error rate 65% exceeds threshold 50%" }
  ],
  DISK_PRESSURE: [
    { level: "WARN", msg: "Node disk pressure: /var/log usage at 87% (8.7GB/10GB)" },
    { level: "ERROR", msg: "ENOSPC: No space left on device - unable to write to /var/lib/docker" },
    { level: "ERROR", msg: "inode exhaustion detected: 98% inodes used on /data volume" },
    { level: "FATAL", msg: "Database write failed: No space left on device - potential data corruption risk" },
    { level: "WARN", msg: "Log rotation failed: insufficient disk space for compressed archive" }
  ]
};

// AI analysis responses for each incident type
const aiAnalysis = {
  MEMORY_LEAK: {
    summary: "Memory leak detected in application heap. GC is unable to reclaim memory at the same rate it's being allocated, suggesting objects are being retained in long-lived caches or static collections.",
    rootCause: "Analysis of heap growth pattern indicates unbounded session cache in SessionCache.java. The cache is configured without TTL or max-size bounds, causing heap exhaustion under high load. Correlated with traffic spike 45 minutes prior.",
    confidence: 94,
    recommendation: "Immediate: Rolling restart to restore service. Long-term: Add LRU eviction policy to SessionCache with max 10,000 entries and 30-minute TTL. Consider implementing heap dumps on OOM for future diagnosis.",
    estimatedImpact: "Service degradation affecting ~2,300 users. API response times elevated 340%."
  },
  POD_CRASH_LOOP: {
    summary: "Pod entering crash loop due to unhandled nil pointer dereference on startup. Service cannot initialize successfully, causing Kubernetes to repeatedly restart the container.",
    rootCause: "The container exits with SIGKILL (exit code 137) during initialization. Stack trace points to nil pointer dereference when reading database configuration. Recent deployment (v2.0.5) introduced a new config key 'DB_REPLICA_HOST' that is not present in the current ConfigMap, causing null reference exception.",
    confidence: 97,
    recommendation: "Immediate: Rollback to previous image version. The fix requires adding 'DB_REPLICA_HOST' to the Kubernetes ConfigMap or making the config key optional with a fallback value.",
    estimatedImpact: "Service completely unavailable. Downstream services experiencing cascading failures."
  },
  DB_CONNECTION_SATURATION: {
    summary: "PostgreSQL connection pool exhausted. Services unable to acquire database connections, causing request queuing and timeouts across all database-dependent services.",
    rootCause: "Connection pool analysis reveals 23 idle connections held by order-service with last activity >5 minutes ago. These connections are not being released after request completion, indicating a connection leak introduced in the last deployment. Additionally, a long-running analytics query (running 47 minutes) is holding 8 connections.",
    confidence: 91,
    recommendation: "Immediate: Kill idle connections and scale PgBouncer. The connection leak in order-service should be fixed by adding connection.close() in the finally block of the database transaction handler.",
    estimatedImpact: "All database operations queued or failing. Transaction processing halted. Revenue impact estimated at $12,400/minute."
  },
  HIGH_CPU: {
    summary: "CPU utilization has reached critical levels causing request timeouts and service degradation. Thread pool exhaustion preventing new request processing.",
    rootCause: "CPU profiling reveals a recursive function call in the report generation service entering an infinite loop when processing malformed input containing circular JSON references. The function lacks depth limit checks, causing stack overflow and 100% CPU utilization on all cores.",
    confidence: 88,
    recommendation: "Immediate: Restart affected pods and add input validation. Long-term: Add recursion depth limits and input sanitization for the report generation endpoint.",
    estimatedImpact: "API response times exceeding SLA. 67% of requests timing out."
  },
  NETWORK_LATENCY: {
    summary: "Significant network latency spike affecting inter-service communication. Circuit breakers opening across multiple service boundaries.",
    rootCause: "Network trace analysis shows increased latency originating from the service mesh sidecar (Envoy proxy). Recent Istio upgrade (1.18 → 1.19) introduced a configuration change causing suboptimal connection pooling to upstream services. DNS resolution is also affected due to CoreDNS pod restart during the same maintenance window.",
    confidence: 83,
    recommendation: "Immediate: Restart ingress controller and flush DNS cache. Long-term: Review Istio 1.19 connection pool configuration and consider rollback if latency persists.",
    estimatedImpact: "P99 latency elevated from 180ms to 2.3s. User-facing checkout flow heavily impacted."
  },
  DISK_PRESSURE: {
    summary: "Node disk pressure critical. Write operations failing, risking data corruption and service failures across multiple pods on the affected node.",
    rootCause: "Disk usage analysis shows /var/log consuming 8.7GB of the 10GB allocation. Debug logging was inadvertently enabled in the API gateway deployment 3 days ago, generating 4GB/day of verbose request logs. Additionally, 2.1GB of uncompressed core dumps from previous crash events are accumulating.",
    confidence: 96,
    recommendation: "Immediate: Rotate logs, remove core dumps, expand PVC. Long-term: Implement log retention policy (7 days, compressed), disable debug logging in production, and set up PVC auto-expansion alerts at 70%.",
    estimatedImpact: "Database writes failing. Risk of data loss if not resolved within 30 minutes."
  }
};

// System-wide metrics baseline
const metricsBaseline = {
  cpu: { min: 15, max: 35, spike: 95 },
  memory: { min: 30, max: 65, spike: 95 },
  network_latency_ms: { min: 45, max: 180, spike: 2300 },
  db_connections: { min: 10, max: 45, spike: 98 },
  error_rate: { min: 0.01, max: 0.5, spike: 45 },
  requests_per_second: { min: 120, max: 450, spike: 890 },
  disk_usage: { min: 35, max: 65, spike: 97 }
};

// Knowledge base initial entries
const initialKnowledge = [
  {
    id: "kb-001",
    title: "Memory Leak - Unbounded Cache Pattern",
    category: "MEMORY_LEAK",
    problem: "Application heap continuously growing due to unbounded in-memory cache without eviction policy",
    solution: "Add LRU eviction with max-size bounds and TTL. Implement heap dump capture on OOM for analysis.",
    triggers: ["OutOfMemoryError", "heap space", "GC overhead limit exceeded"],
    successRate: 94,
    timesUsed: 23,
    avgResolutionTime: "4.2 minutes",
    createdBy: "manual",
    tags: ["java", "cache", "memory", "heap"]
  },
  {
    id: "kb-002",
    title: "CrashLoopBackOff - Missing ConfigMap Key",
    category: "POD_CRASH_LOOP",
    problem: "Container crashes on startup due to missing required environment variable or ConfigMap key",
    solution: "Check ConfigMap for all required keys in new deployment. Add default values or optional binding for non-critical config.",
    triggers: ["CrashLoopBackOff", "nil pointer dereference", "config key not found"],
    successRate: 97,
    timesUsed: 15,
    avgResolutionTime: "3.8 minutes",
    createdBy: "manual",
    tags: ["kubernetes", "configmap", "crash", "deployment"]
  },
  {
    id: "kb-003",
    title: "DB Connection Leak - Missing Connection Release",
    category: "DB_CONNECTION_SATURATION",
    problem: "Database connections not released after use, exhausting connection pool",
    solution: "Use connection in try-with-resources or ensure close() in finally block. Deploy PgBouncer for connection pooling.",
    triggers: ["connection pool exhausted", "max_connections reached", "idle connections"],
    successRate: 91,
    timesUsed: 31,
    avgResolutionTime: "6.1 minutes",
    createdBy: "manual",
    tags: ["postgresql", "connection-pool", "leak", "pgbouncer"]
  }
];

module.exports = {
  dockerContainers,
  incidentTypes,
  logTemplates,
  aiAnalysis,
  metricsBaseline,
  initialKnowledge
};
