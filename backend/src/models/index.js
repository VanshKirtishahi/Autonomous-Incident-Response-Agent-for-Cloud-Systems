const mongoose = require('mongoose');

// Incident Model
const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
  status: {
    type: String,
    enum: ['detecting', 'diagnosing', 'remediating', 'verifying', 'resolved', 'failed', 'rolled_back'],
    default: 'detecting'
  },
  affectedService: { type: String, required: true },
  affectedContainer: { type: String },
  dockerImage: { type: String },
  previousDockerImage: { type: String },
  detectedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  duration: { type: Number }, // in seconds
  rootCause: { type: String },
  aiAnalysis: {
    summary: String,
    rootCause: String,
    confidence: Number,
    recommendation: String,
    estimatedImpact: String
  },
  playbookSteps: [{
    step: Number,
    action: String,
    description: String,
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    startedAt: Date,
    completedAt: Date,
    output: String
  }],
  rollbackTriggered: { type: Boolean, default: false },
  rollbackReason: { type: String },
  metrics: {
    beforeRemediation: mongoose.Schema.Types.Mixed,
    afterRemediation: mongoose.Schema.Types.Mixed
  },
  newRunbookProposed: { type: Boolean, default: false },
  proposedRunbookId: { type: String }
}, { timestamps: true });

// Container/Service Model
const containerSchema = new mongoose.Schema({
  containerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  previousImage: { type: String },
  status: { type: String, enum: ['running', 'stopped', 'restarting', 'crashed', 'rolling_back'], default: 'running' },
  uptime: { type: String },
  cpu: { type: Number, default: 0 },
  memory: { type: Number, default: 0 },
  memoryLimit: { type: Number },
  restarts: { type: Number, default: 0 },
  service: { type: String },
  replicas: { type: Number, default: 1 },
  healthStatus: { type: String, enum: ['healthy', 'degraded', 'unhealthy', 'unknown'], default: 'healthy' },
  lastChecked: { type: Date, default: Date.now }
}, { timestamps: true });

// Log Model
const logSchema = new mongoose.Schema({
  containerId: { type: String, required: true },
  containerName: { type: String },
  service: { type: String },
  level: { type: String, enum: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  incidentId: { type: String },
  anomalyScore: { type: Number, default: 0 },
  isAnomaly: { type: Boolean, default: false },
  tags: [String],
  metadata: mongoose.Schema.Types.Mixed
});

// Knowledge Base Model
const knowledgeSchema = new mongoose.Schema({
  knowledgeId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  problem: { type: String, required: true },
  solution: { type: String, required: true },
  triggers: [String],
  successRate: { type: Number, default: 0 },
  timesUsed: { type: Number, default: 0 },
  avgResolutionTime: { type: String },
  createdBy: { type: String, enum: ['manual', 'agent', 'learned'], default: 'agent' },
  tags: [String],
  sourceIncidentId: { type: String },
  approved: { type: Boolean, default: false }
}, { timestamps: true });

// Metrics Model (time-series style)
const metricsSchema = new mongoose.Schema({
  service: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  cpu: Number,
  memory: Number,
  networkLatency: Number,
  dbConnections: Number,
  errorRate: Number,
  requestsPerSecond: Number,
  diskUsage: Number
});

const Incident = mongoose.model('Incident', incidentSchema);
const Container = mongoose.model('Container', containerSchema);
const Log = mongoose.model('Log', logSchema);
const Knowledge = mongoose.model('Knowledge', knowledgeSchema);
const Metrics = mongoose.model('Metrics', metricsSchema);

module.exports = { Incident, Container, Log, Knowledge, Metrics };
