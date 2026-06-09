/**
 * Prometheus 监控指标
 */
const promBundle = require('express-prom-bundle');
const client = require('prom-client');
const config = require('../config');

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: config.metrics.enabled,
  customLabels: { project: 'meeting-action-extractor' },
  promClient: { collectDefaultMetrics: {} },
});

const actionItemCounter = new client.Counter({
  name: 'action_items_extracted_total',
  help: 'Total action items extracted',
  labelNames: ['status', 'model'],
});

const extractionHistogram = new client.Histogram({
  name: 'action_extraction_duration_seconds',
  help: 'Duration of action extraction',
  labelNames: ['model'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
});

const reviewCounter = new client.Counter({
  name: 'review_tasks_total',
  help: 'Total review tasks processed',
  labelNames: ['status', 'field_type'],
});

const assigneePendingCounter = new client.Gauge({
  name: 'assignee_pending_total',
  help: 'Number of action items with pending assignee confirmation',
});

const syncCounter = new client.Counter({
  name: 'task_sync_total',
  help: 'Total task sync attempts',
  labelNames: ['target_system', 'status'],
});

function recordExtraction(model, success, duration) {
  actionItemCounter.inc({ status: success ? 'success' : 'failed', model });
  extractionHistogram.observe({ model }, duration);
}

function recordReview(status, fieldType) {
  reviewCounter.inc({ status, field_type: fieldType });
}

function recordSync(target, status) {
  syncCounter.inc({ target_system: target, status });
}

function setPendingAssigneeCount(n) {
  assigneePendingCounter.set(n);
}

module.exports = {
  metricsMiddleware,
  client,
  recordExtraction,
  recordReview,
  recordSync,
  setPendingAssigneeCount,
};
