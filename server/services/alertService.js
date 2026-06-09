const models = require('../models');
const axios = require('axios');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

class AlertService {
  constructor() {
    this._alertCache = new Map();
  }

  async create(alertData, options = {}) {
    try {
      const dedupKey = this._generateDedupKey(alertData);
      const now = Date.now();

      if (!options.force && this._alertCache.has(dedupKey)) {
        const cached = this._alertCache.get(dedupKey);
        if (now - cached.timestamp < 5 * 60 * 1000) {
          return null;
        }
      }

      this._alertCache.set(dedupKey, { timestamp: now });

      const alert = await models.Alert.create({
        id: uuidv4(),
        alert_type: alertData.alert_type,
        severity: alertData.severity || 'warning',
        title: alertData.title,
        message: alertData.message || '',
        contract_id: alertData.contract_id || null,
        entity_type: alertData.entity_type || null,
        entity_id: alertData.entity_id || null,
        service_name: alertData.service_name || null,
        error_code: alertData.error_code || null,
        error_stack: alertData.error_stack || null,
        drift_metric: alertData.drift_metric || null,
        missing_fields: alertData.missing_fields || [],
        metadata: alertData.metadata || {},
      });

      await this._notifyChannels(alert);

      return alert;
    } catch (error) {
      console.error('Failed to create alert:', error);
      return null;
    }
  }

  async acknowledge(alertId, userId) {
    return models.Alert.update(
      {
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date(),
      },
      { where: { id: alertId } }
    );
  }

  async resolve(alertId, userId, notes = '') {
    return models.Alert.update(
      {
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date(),
        resolution_notes: notes,
      },
      { where: { id: alertId } }
    );
  }

  async list(options = {}) {
    const {
      status = 'active',
      severity = null,
      alert_type = null,
      contract_id = null,
      limit = 100,
      offset = 0,
    } = options;

    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (alert_type) where.alert_type = alert_type;
    if (contract_id) where.contract_id = contract_id;

    return models.Alert.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
  }

  async checkDataMissing(entityType, entityData, requiredFields, entityId, contractId) {
    const missing = [];

    for (const field of requiredFields) {
      const value = this._getNestedValue(entityData, field);
      if (value === null || value === undefined || value === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return this.create({
        alert_type: 'data_missing',
        severity: missing.length > requiredFields.length / 2 ? 'error' : 'warning',
        title: `${entityType} 数据字段缺失`,
        message: `以下字段为空或缺失: ${missing.join(', ')}`,
        entity_type: entityType,
        entity_id: entityId,
        contract_id: contractId,
        missing_fields: missing,
        metadata: { total_required: requiredFields.length, missing_count: missing.length },
      });
    }

    return null;
  }

  async detectModelDrift(currentMetrics, baselineMetrics, contractId) {
    const currentAvg = this._calculateAverageConfidence(currentMetrics);
    const baselineAvg = this._calculateAverageConfidence(baselineMetrics);

    if (baselineAvg > 0) {
      const drift = Math.abs(currentAvg - baselineAvg) / baselineAvg;

      if (drift > config.alerts.modelDriftThreshold) {
        await this.create({
          alert_type: 'model_drift',
          severity: drift > config.alerts.modelDriftThreshold * 1.5 ? 'critical' : 'warning',
          title: '模型输出置信度发生显著变化',
          message: `检测到模型置信度漂移: ${(drift * 100).toFixed(2)}%, 基线: ${baselineAvg.toFixed(4)}, 当前: ${currentAvg.toFixed(4)}`,
          contract_id: contractId,
          drift_metric: {
            drift_percentage: drift,
            baseline_avg_confidence: baselineAvg,
            current_avg_confidence: currentAvg,
            threshold: config.alerts.modelDriftThreshold,
            sample_size: currentMetrics.length,
          },
        });
        return true;
      }
    }
    return false;
  }

  _generateDedupKey(alertData) {
    return `${alertData.alert_type}:${alertData.service_name || ''}:${alertData.error_code || ''}:${alertData.contract_id || ''}:${alertData.title}`;
  }

  async _notifyChannels(alert) {
    try {
      if (config.alerts.webhookUrl && ['error', 'critical'].includes(alert.severity)) {
        await axios.post(
          config.alerts.webhookUrl,
          {
            alert_id: alert.id,
            type: alert.alert_type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            timestamp: alert.created_at,
            url: `/alerts/${alert.id}`,
          },
          { timeout: 5000 }
        );
      }
    } catch (e) {
      console.warn('Webhook notification failed:', e.message);
    }
  }

  _getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => (o || {})[k], obj);
  }

  _calculateAverageConfidence(metrics) {
    if (!Array.isArray(metrics) || metrics.length === 0) return 0;
    const sum = metrics.reduce((s, m) => s + (m.confidence_score || 0), 0);
    return sum / metrics.length;
  }
}

module.exports = new AlertService();
