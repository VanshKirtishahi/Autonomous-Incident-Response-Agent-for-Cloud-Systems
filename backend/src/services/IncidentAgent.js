const { v4: uuidv4 } = require('uuid');
const { Incident, Container, Log, Knowledge, Metrics } = require('../models');
const { incidentTypes, logTemplates, aiAnalysis, dockerContainers, metricsBaseline, initialKnowledge } = require('../data/dummyData');

class IncidentAgent {
  constructor() {
    this.activeIncidents = new Map();
    this.monitoringActive = false;
    this.simulationInterval = null;
    this.metricsInterval = null;
  }

  generateMetrics(service, incidentType = null) {
    const base = metricsBaseline;
    const spike = incidentType !== null;

    const rand = (min, max) => Math.random() * (max - min) + min;
    const metrics = {
      service,
      timestamp: new Date(),
      cpu: spike && incidentType === 'HIGH_CPU' ? rand(85, 99) : rand(base.cpu.min, base.cpu.max),
      memory: spike && incidentType === 'MEMORY_LEAK' ? rand(85, 99) : rand(base.memory.min, base.memory.max),
      networkLatency: spike && incidentType === 'NETWORK_LATENCY' ? rand(800, 3000) : rand(base.network_latency_ms.min, base.network_latency_ms.max),
      dbConnections: spike && incidentType === 'DB_CONNECTION_SATURATION' ? rand(90, 100) : rand(base.db_connections.min, base.db_connections.max),
      errorRate: spike ? rand(20, 65) : rand(base.error_rate.min, base.error_rate.max),
      requestsPerSecond: rand(base.requests_per_second.min, base.requests_per_second.max),
      diskUsage: spike && incidentType === 'DISK_PRESSURE' ? rand(87, 99) : rand(base.disk_usage.min, base.disk_usage.max)
    };

    return metrics;
  }

  async seedData() {
    try {
      const containerCount = await Container.countDocuments();
      if (containerCount === 0) {
        const containers = dockerContainers.map(c => ({
          containerId: c.id,
          name: c.name,
          image: c.image,
          previousImage: c.previousImage,
          status: c.status,
          uptime: c.uptime,
          cpu: c.cpu,
          memory: Math.round((c.memory / c.memoryLimit) * 100),
          memoryLimit: c.memoryLimit,
          restarts: c.restarts,
          service: c.service,
          replicas: c.replicas,
          healthStatus: 'healthy'
        }));
        await Container.insertMany(containers);
        console.log('✓ Containers seeded');
      }

      const kbCount = await Knowledge.countDocuments();
      if (kbCount === 0) {
        const knowledge = initialKnowledge.map(k => ({
          knowledgeId: k.id,
          title: k.title,
          category: k.category,
          problem: k.problem,
          solution: k.solution,
          triggers: k.triggers,
          successRate: k.successRate,
          timesUsed: k.timesUsed,
          avgResolutionTime: k.avgResolutionTime,
          createdBy: k.createdBy,
          tags: k.tags,
          approved: true
        }));
        await Knowledge.insertMany(knowledge);
        console.log('✓ Knowledge base seeded');
      }

      const metricsCount = await Metrics.countDocuments();
      if (metricsCount === 0) {
        const metricsData = [];
        const services = dockerContainers.map(c => c.service);
        const now = new Date();
        for (let i = 60; i >= 0; i--) {
          for (const service of services) {
            const m = this.generateMetrics(service);
            m.timestamp = new Date(now.getTime() - i * 60 * 1000);
            metricsData.push(m);
          }
        }
        await Metrics.insertMany(metricsData);
        console.log('✓ Metrics history seeded');
      }

      const incidentCount = await Incident.countDocuments();
      if (incidentCount === 0) {
        await this.seedHistoricalIncidents();
      }

    } catch (err) {
      console.error('Seed error:', err.message);
    }
  }

  async seedHistoricalIncidents() {
    try {
      const types = ['MEMORY_LEAK', 'POD_CRASH_LOOP', 'DB_CONNECTION_SATURATION', 'HIGH_CPU', 'DISK_PRESSURE'];
      const services = ['user-service', 'payment-service', 'order-service', 'api-gateway', 'inventory-service'];

      for (let i = 0; i < 8; i++) {
        const type = types[i % types.length];
        const service = services[i % services.length];
        const container = dockerContainers.find(c => c.service === service) || dockerContainers[0];
        const incType = incidentTypes[type];
        const analysis = aiAnalysis[type];
        const detectedAt = new Date(Date.now() - (i + 1) * 3 * 60 * 60 * 1000);
        const resolvedAt = new Date(detectedAt.getTime() + Math.random() * 8 * 60 * 1000 + 2 * 60 * 1000);

        const steps = incType.playbook.map(s => ({
          ...s,
          status: 'completed',
          startedAt: new Date(detectedAt.getTime() + s.step * 20000),
          completedAt: new Date(detectedAt.getTime() + s.step * 20000 + s.duration),
          output: `✓ ${s.description} completed successfully`
        }));

        await Incident.create({
          incidentId: `INC-${String(1000 + i).padStart(4, '0')}`,
          type,
          title: incType.name,
          severity: incType.severity,
          status: 'resolved',
          affectedService: service,
          affectedContainer: container.name,
          dockerImage: container.image,
          previousDockerImage: container.previousImage,
          detectedAt,
          resolvedAt,
          duration: Math.round((resolvedAt - detectedAt) / 1000),
          rootCause: analysis.rootCause,
          aiAnalysis: analysis,
          playbookSteps: steps,
          rollbackTriggered: type === 'POD_CRASH_LOOP' && i % 2 === 0,
          rollbackReason: type === 'POD_CRASH_LOOP' && i % 2 === 0 ? 'Fix validation failed - reverting to stable image' : null,
          metrics: {
            beforeRemediation: { cpu: 87, memory: 92, errorRate: 45 },
            afterRemediation: { cpu: 22, memory: 58, errorRate: 0.3 }
          }
        });
      }
      console.log('✓ Historical incidents seeded');
    } catch (error) {
      console.error('Seed historical incidents error:', error.message);
    }
  }

  async triggerIncident(type, container) {
    try {
      if (!incidentTypes[type]) return;

      const incType = incidentTypes[type];
      const incidentId = `INC-${Date.now().toString().slice(-6)}`;

      console.log(`\n🚨 INCIDENT DETECTED: ${incType.name} on ${container.name}`);

      const incident = await Incident.create({
        incidentId,
        type,
        title: incType.name,
        severity: incType.severity,
        status: 'detecting',
        affectedService: container.service,
        affectedContainer: container.name,
        dockerImage: container.image,
        previousDockerImage: container.previousImage,
        detectedAt: new Date(),
        playbookSteps: incType.playbook.map(s => ({ ...s, status: 'pending' }))
      });

      this.activeIncidents.set(incidentId, incident);
      await this.generateIncidentLogs(type, container, incidentId);

      // Background progression
      setTimeout(async () => {
        try {
          await this.updateIncidentStatus(incidentId, 'diagnosing');
          const analysis = aiAnalysis[type];
          await Incident.findOneAndUpdate(
            { incidentId },
            { aiAnalysis: analysis, rootCause: analysis.rootCause }
          );
        } catch (e) { }
      }, 2000);

      setTimeout(async () => {
        try {
          await this.updateIncidentStatus(incidentId, 'remediating');
          const { success, rollbackNeeded } = await this.executePlaybook(incidentId, type, incType.playbook, container);
          
          if (!success || rollbackNeeded) {
            await this.triggerRollback(incidentId, container, rollbackNeeded ? 'Fix validation failed' : 'Remediation unsuccessful');
          } else {
            await this.updateIncidentStatus(incidentId, 'verifying');
            const resolved = await this.verifyRecovery(incidentId, type);
            if (resolved) await this.resolveIncident(incidentId, type, container);
          }
        } catch (e) { }
      }, 5000);

    } catch (error) {
      console.error('Trigger incident error:', error.message);
    }
  }

  async executePlaybook(incidentId, type, playbook, container) {
    try {
      let allSucceeded = true;
      for (const step of playbook) {
        const startedAt = new Date();
        await Incident.findOneAndUpdate(
          { incidentId, 'playbookSteps.step': step.step },
          { $set: { 'playbookSteps.$.status': 'running', 'playbookSteps.$.startedAt': startedAt } }
        );

        await this.sleep(1000); 

        const stepFailed = type === 'POD_CRASH_LOOP' && step.step === 4 && Math.random() < 0.3;
        const status = stepFailed ? 'failed' : 'completed';
        const completedAt = new Date();
        const output = stepFailed
          ? `✗ Validation failed: Post-fix health check returned 500 - triggering rollback`
          : `✓ ${step.description} completed`;

        await Incident.findOneAndUpdate(
          { incidentId, 'playbookSteps.step': step.step },
          { $set: { 'playbookSteps.$.status': status, 'playbookSteps.$.completedAt': completedAt, 'playbookSteps.$.output': output } }
        );

        if (stepFailed) {
          allSucceeded = false;
          return { success: false, rollbackNeeded: true };
        }
      }
      return { success: allSucceeded, rollbackNeeded: false };
    } catch (error) {
      console.error('Execute playbook error:', error.message);
      return { success: false, rollbackNeeded: false };
    }
  }

  async triggerRollback(incidentId, container, reason) {
    try {
      console.log(`🔄 ROLLBACK TRIGGERED for ${container.name}: ${reason}`);
      await Container.findOneAndUpdate({ containerId: container.id }, { status: 'rolling_back' });
      await this.sleep(3000);

      await Container.findOneAndUpdate(
        { containerId: container.id },
        { status: 'running', image: container.previousImage, healthStatus: 'healthy', restarts: 0 }
      );

      await Incident.findOneAndUpdate(
        { incidentId },
        { status: 'rolled_back', rollbackTriggered: true, rollbackReason: reason, resolvedAt: new Date() }
      );

      await Log.create({
        containerId: container.id,
        containerName: container.name,
        service: container.service,
        level: 'INFO',
        message: `✓ Rollback completed: Restored ${container.previousImage} - service stable`,
        incidentId,
        isAnomaly: false,
        tags: ['rollback', 'recovery']
      });

      await this.proposeRunbook(incidentId, 'POD_CRASH_LOOP', container, true);
    } catch (error) {
      console.error('Trigger rollback error:', error.message);
    }
  }

  async verifyRecovery(incidentId, type) {
    try {
      return Math.random() > 0.05; 
    } catch (error) {
      return false;
    }
  }

  async resolveIncident(incidentId, type, container) {
    try {
      const resolvedAt = new Date();
      const incident = await Incident.findOne({ incidentId });
      const duration = incident ? Math.round((resolvedAt - incident.detectedAt) / 1000) : 0;

      await Incident.findOneAndUpdate(
        { incidentId },
        {
          status: 'resolved',
          resolvedAt,
          duration,
          'metrics.afterRemediation': {
            cpu: Math.random() * 25 + 10,
            memory: Math.random() * 30 + 20,
            errorRate: Math.random() * 0.4
          }
        }
      );

      await Container.findOneAndUpdate(
        { name: container.name },
        { status: 'running', healthStatus: 'healthy', cpu: Math.random() * 30 + 10, memory: Math.random() * 40 + 20 }
      );

      this.activeIncidents.delete(incidentId);
      console.log(`✅ INCIDENT ${incidentId} RESOLVED in ${duration}s`);
      await this.proposeRunbook(incidentId, type, container, false);
    } catch (error) {
      console.error('Resolve incident error:', error.message);
    }
  }

  async proposeRunbook(incidentId, type, container, fromRollback) {
    try {
      const analysis = aiAnalysis[type];
      if (!analysis) return;

      const knowledgeId = `kb-${Date.now()}`;
      await Knowledge.create({
        knowledgeId,
        title: `Auto-learned: ${incidentTypes[type].name} on ${container.service}`,
        category: type,
        problem: analysis.summary,
        solution: analysis.recommendation,
        triggers: incidentTypes[type].patterns.slice(0, 3),
        successRate: fromRollback ? 72 : 94,
        timesUsed: 1,
        avgResolutionTime: fromRollback ? '8.5 minutes (with rollback)' : '5.2 minutes',
        createdBy: 'learned',
        tags: [container.service, type.toLowerCase().replace(/_/g, '-'), 'auto-generated'],
        sourceIncidentId: incidentId,
        approved: false
      });

      await Incident.findOneAndUpdate({ incidentId }, { newRunbookProposed: true, proposedRunbookId: knowledgeId });
    } catch (error) {
      console.error('Propose runbook error:', error.message);
    }
  }

  async updateIncidentStatus(incidentId, status) {
    try {
      await Incident.findOneAndUpdate({ incidentId }, { status });
    } catch (error) {
      console.error('Update incident status error:', error.message);
    }
  }

  async generateIncidentLogs(type, container, incidentId) {
    try {
      const templates = logTemplates[type] || [];
      const logs = templates.map((t, i) => ({
        containerId: container.id,
        containerName: container.name,
        service: container.service,
        level: t.level,
        message: t.msg,
        timestamp: new Date(Date.now() - (templates.length - i) * 15000),
        incidentId,
        anomalyScore: t.level === 'FATAL' ? 99 : t.level === 'ERROR' ? 85 : 60,
        isAnomaly: true,
        tags: [type.toLowerCase(), container.service, 'anomaly']
      }));
      await Log.insertMany(logs);
    } catch (error) {
      console.error('Generate incident logs error:', error.message);
    }
  }

  startMonitoring() {
    if (this.monitoringActive) return;
    this.monitoringActive = true;

    this.metricsInterval = setInterval(async () => {
      try {
        const containers = await Container.find({ status: 'running' }).limit(5);
        const metricsData = containers.map(c => ({
          service: c.service,
          timestamp: new Date(),
          cpu: c.cpu + (Math.random() - 0.5) * 10,
          memory: c.memory + (Math.random() - 0.5) * 8,
          networkLatency: Math.random() * 150 + 40,
          dbConnections: Math.random() * 40 + 5,
          errorRate: Math.random() * 0.8,
          requestsPerSecond: Math.random() * 300 + 100,
          diskUsage: Math.random() * 30 + 30
        }));
        await Metrics.insertMany(metricsData);
      } catch (error) { }
    }, 5000);

    console.log('🤖 Agent monitoring started');
  }

  stopMonitoring() {
    this.monitoringActive = false;
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    console.log('Agent monitoring stopped');
  }

  sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

module.exports = IncidentAgent;