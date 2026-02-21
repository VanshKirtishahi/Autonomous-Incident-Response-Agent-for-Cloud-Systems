const express = require('express');
const router = express.Router();
const { Incident, Container, Log, Knowledge, Metrics } = require('../models');
const { dockerContainers, incidentTypes } = require('../data/dummyData');

// ─── INCIDENTS ───────────────────────────────────────────────────────────────

router.get('/incidents', async (req, res) => {
  try {
    const { status, severity, limit = 20, page = 1 } = req.query;
    const filter = {};
    if (status) filter.status = { $in: status.split(',') };
    if (severity) filter.severity = severity;

    const total = await Incident.countDocuments(filter);
    const incidents = await Incident.find(filter)
      .sort({ detectedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    res.json({ incidents, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/incidents/:id', async (req, res) => {
  try {
    const incident = await Incident.findOne({ incidentId: req.params.id });
    if (!incident) return res.status(404).json({ error: 'Not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/incidents/trigger', async (req, res) => {
  try {
    const { type, containerId } = req.body;
    const agent = req.app.get('agent');

    if (!agent) return res.status(503).json({ error: 'Agent not available' });
    if (!incidentTypes[type]) return res.status(400).json({ error: 'Invalid incident type' });

    const container = containerId
      ? dockerContainers.find(c => c.id === containerId)
      : dockerContainers[Math.floor(Math.random() * dockerContainers.length)];

    if (!container) return res.status(404).json({ error: 'Container not found' });

    agent.triggerIncident(type, container);

    res.json({ message: 'Incident simulation started', type, container: container.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/incidents/stats/summary', async (req, res) => {
  try {
    const [total, active, resolved, critical] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: { $in: ['detecting', 'diagnosing', 'remediating', 'verifying'] } }),
      Incident.countDocuments({ status: 'resolved' }),
      Incident.countDocuments({ severity: 'critical' })
    ]);

    const avgDuration = await Incident.aggregate([
      { $match: { status: 'resolved', duration: { $exists: true, $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$duration' } } }
    ]);

    const byType = await Incident.aggregate([
      { $match: { type: { $exists: true, $ne: null } } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const recentTrend = await Incident.aggregate([
      { $match: { detectedAt: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 7 }
    ]);

    res.json({
      total,
      active,
      resolved,
      critical,
      avgResolutionTime: avgDuration[0]?.avg ? Math.round(avgDuration[0].avg) : 0,
      byType,
      recentTrend,
      rollbacks: await Incident.countDocuments({ rollbackTriggered: true }),
      learningProposals: await Incident.countDocuments({ newRunbookProposed: true })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CONTAINERS ───────────────────────────────────────────────────────────────

router.get('/containers', async (req, res) => {
  try {
    const containers = await Container.find().sort({ name: 1 });
    res.json(containers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/containers/:id', async (req, res) => {
  try {
    const container = await Container.findOne({
      $or: [{ containerId: req.params.id }, { name: req.params.id }]
    });
    if (!container) return res.status(404).json({ error: 'Not found' });
    res.json(container);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LOGS ─────────────────────────────────────────────────────────────────────

router.get('/logs', async (req, res) => {
  try {
    const { service, level, incidentId, limit = 100, anomalyOnly } = req.query;
    const filter = {};
    if (service) filter.service = service;
    if (level) filter.level = level;
    if (incidentId) filter.incidentId = incidentId;
    if (anomalyOnly === 'true') filter.isAnomaly = true;

    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(logs.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────

router.get('/knowledge', async (req, res) => {
  try {
    const { category, createdBy } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (createdBy) filter.createdBy = createdBy;

    const knowledge = await Knowledge.find(filter).sort({ timesUsed: -1, createdAt: -1 });
    res.json(knowledge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/knowledge/:id/approve', async (req, res) => {
  try {
    const kb = await Knowledge.findOneAndUpdate(
      { knowledgeId: req.params.id },
      { approved: true },
      { new: true }
    );
    if (!kb) return res.status(404).json({ error: 'Not found' });
    res.json(kb);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── METRICS ─────────────────────────────────────────────────────────────────

router.get('/metrics', async (req, res) => {
  try {
    const { service, limit = 60 } = req.query;
    const filter = service ? { service } : {};
    const metrics = await Metrics.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    res.json(metrics.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/metrics/current', async (req, res) => {
  try {
    const services = [...new Set(dockerContainers.map(c => c.service))];
    const current = {};

    for (const service of services) {
      const latest = await Metrics.findOne({ service }).sort({ timestamp: -1 });
      if (latest) current[service] = latest;
    }

    res.json(current);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AGENT CONTROL ───────────────────────────────────────────────────────────

router.post('/agent/start', (req, res) => {
  try {
    const agent = req.app.get('agent');
    if (agent) {
      agent.startMonitoring();
      res.json({ status: 'started' });
    } else {
      res.status(503).json({ error: 'Agent not available' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/agent/stop', (req, res) => {
  try {
    const agent = req.app.get('agent');
    if (agent) {
      agent.stopMonitoring();
      res.json({ status: 'stopped' });
    } else {
      res.status(503).json({ error: 'Agent not available' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/agent/status', (req, res) => {
  try {
    const agent = req.app.get('agent');
    res.json({
      monitoring: agent?.monitoringActive || false,
      activeIncidents: agent ? agent.activeIncidents.size : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/incident-types', (req, res) => {
  try {
    const types = Object.entries(incidentTypes).map(([key, val]) => ({
      key,
      name: val.name,
      severity: val.severity,
      steps: val.playbook.length
    }));
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;