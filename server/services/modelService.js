/**
 * 模型注册与管理服务
 */
const { getDb } = require('../db');
const { uuid, now, parseJsonSafe, stringifyIfNeeded } = require('../utils/common');
const audit = require('../audit');
const queue = require('../queue');
const logger = require('../utils/logger');

function registerModel(opts) {
  const { name, version, provider, description = null, metrics = null, operatorName = 'system' } = opts;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM registered_models WHERE name = ? AND version = ?').get(name, version);
  if (existing) throw new Error(`Model ${name}@${version} already exists`);

  const id = uuid();
  db.prepare(`
    INSERT INTO registered_models (id, name, version, provider, description, metrics_summary, registered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, version, provider, description, stringifyIfNeeded(metrics), now());

  audit.log(audit.ENTITY_TYPES.MODEL, id, audit.ACTIONS.CREATE, {
    newValue: { name, version, provider },
    operatorName,
  });
  logger.info(`[model] Registered model ${name}@${version}`);
  return getModel(id);
}

function listModels() {
  return getDb().prepare('SELECT * FROM registered_models ORDER BY registered_at DESC').all()
    .map(m => ({ ...m, metrics_summary: parseJsonSafe(m.metrics_summary, {}) }));
}

function getModel(id) {
  const m = getDb().prepare('SELECT * FROM registered_models WHERE id = ?').get(id);
  if (!m) return null;
  return { ...m, metrics_summary: parseJsonSafe(m.metrics_summary, {}) };
}

function getActiveModel() {
  const m = getDb().prepare('SELECT * FROM registered_models WHERE is_active = 1 LIMIT 1').get();
  return m ? { ...m, metrics_summary: parseJsonSafe(m.metrics_summary, {}) } : null;
}

function promoteModel(id, operatorName = 'system') {
  const db = getDb();
  const target = db.prepare('SELECT * FROM registered_models WHERE id = ?').get(id);
  if (!target) throw new Error('Model not found');

  const tx = db.transaction(() => {
    db.prepare('UPDATE registered_models SET is_active = 0 WHERE is_active = 1').run();
    db.prepare('UPDATE registered_models SET is_active = 1, promoted_at = ? WHERE id = ?').run(now(), id);
    audit.log(audit.ENTITY_TYPES.MODEL, id, audit.ACTIONS.PROMOTE, {
      newValue: { name: target.name, version: target.version, is_active: 1 },
      operatorName,
    });
  });
  tx();
  logger.info(`[model] Promoted ${target.name}@${target.version} to active`);
  return getModel(id);
}

function deleteModel(id, operatorName = 'system') {
  const db = getDb();
  db.prepare('DELETE FROM registered_models WHERE id = ?').run(id);
  audit.log(audit.ENTITY_TYPES.MODEL, id, audit.ACTIONS.DELETE, { operatorName });
}

function createTrainingTask(opts) {
  const { modelName, datasetId = null, hyperparams = {}, operatorName = 'system' } = opts;
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO training_tasks (id, model_name, status, dataset_id, hyperparams, created_at)
    VALUES (?, ?, 'queued', ?, ?, ?)
  `).run(id, modelName, datasetId, stringifyIfNeeded(hyperparams), now());
  audit.log(audit.ENTITY_TYPES.TRAINING_TASK, id, audit.ACTIONS.CREATE, {
    newValue: { modelName, datasetId },
    operatorName,
  });
  queue.addJob(queue.QUEUE_NAMES.TRAINING, { trainingTaskId: id }, { priority: 10 });
  logger.info(`[training] Task ${id} created for ${modelName}`);
  return getTrainingTask(id);
}

function listTrainingTasks(limit = 50) {
  return getDb().prepare('SELECT * FROM training_tasks ORDER BY created_at DESC LIMIT ?').all(limit)
    .map(t => ({ ...t, hyperparams: parseJsonSafe(t.hyperparams, {}) }));
}

function getTrainingTask(id) {
  const t = getDb().prepare('SELECT * FROM training_tasks WHERE id = ?').get(id);
  if (!t) return null;
  return { ...t, hyperparams: parseJsonSafe(t.hyperparams, {}) };
}

function updateTrainingProgress(id, progress, status = null) {
  const db = getDb();
  const sets = ['progress = ?'];
  const values = [progress];
  if (status) { sets.push('status = ?'); values.push(status); }
  if (status === 'completed') { sets.push('completed_at = ?'); values.push(now()); }
  if (status === 'running' && !db.prepare('SELECT started_at FROM training_tasks WHERE id = ?').get(id).started_at) {
    sets.push('started_at = ?'); values.push(now());
  }
  values.push(id);
  db.prepare(`UPDATE training_tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values);
}

function createDataset(opts) {
  const { name, type, sampleCount = 0, description = null, version = '1.0' } = opts;
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO datasets (id, name, type, sample_count, description, version, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, type, sampleCount, description, version, now());
  audit.log(audit.ENTITY_TYPES.DATASET, id, audit.ACTIONS.CREATE, { newValue: opts });
  return getDataset(id);
}

function listDatasets(type = null) {
  const db = getDb();
  let sql = 'SELECT * FROM datasets';
  const params = [];
  if (type) { sql += ' WHERE type = ?'; params.push(type); }
  sql += ' ORDER BY created_at DESC';
  return db.prepare(sql).all(...params);
}

function getDataset(id) {
  return getDb().prepare('SELECT * FROM datasets WHERE id = ?').get(id);
}

function createValidationRun(modelId, datasetId) {
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO validation_runs (id, model_id, dataset_id, status, created_at)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(id, modelId, datasetId, now());
  queue.addJob(queue.QUEUE_NAMES.VALIDATION, { validationRunId: id }, { priority: 5 });
  logger.info(`[validation] Run ${id} created for model ${modelId} on dataset ${datasetId}`);
  return getValidationRun(id);
}

function listValidationRuns(modelId = null, limit = 50) {
  const db = getDb();
  let sql = 'SELECT * FROM validation_runs';
  const params = [];
  if (modelId) { sql += ' WHERE model_id = ?'; params.push(modelId); }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params).map(r => ({ ...r, metrics: parseJsonSafe(r.metrics, {}) }));
}

function getValidationRun(id) {
  const r = getDb().prepare('SELECT * FROM validation_runs WHERE id = ?').get(id);
  if (!r) return null;
  return { ...r, metrics: parseJsonSafe(r.metrics, {}) };
}

function completeValidationRun(id, metrics) {
  const db = getDb();
  db.prepare(`
    UPDATE validation_runs SET status = 'completed', metrics = ?, completed_at = ? WHERE id = ?
  `).run(stringifyIfNeeded(metrics), now(), id);
}

/**
 * 计算验证指标（精度、召回、F1）
 * predictions: [{ sample_id, action_items: [...] }]
 * groundTruth: [{ sample_id, action_items: [...] }]
 */
function computeMetrics(predictions, groundTruth) {
  let tp = 0, fp = 0, fn = 0;
  const perField = {
    title: { correct: 0, total: 0 },
    assignee: { correct: 0, total: 0, pendingCorrect: 0, pendingTotal: 0 },
    deadline: { correct: 0, total: 0, pendingCorrect: 0, pendingTotal: 0 },
    milestone: { correct: 0, total: 0 },
  };

  const gtMap = new Map(groundTruth.map(g => [g.sample_id, g]));

  for (const pred of predictions) {
    const gt = gtMap.get(pred.sample_id);
    if (!gt) continue;

    const predItems = pred.action_items || [];
    const gtItems = gt.action_items || [];
    const matchedGt = new Set();

    for (const pItem of predItems) {
      let bestMatch = null;
      let bestScore = 0;
      for (let i = 0; i < gtItems.length; i++) {
        if (matchedGt.has(i)) continue;
        const g = gtItems[i];
        const score = _titleSimilarity(pItem.title, g.title);
        if (score > bestScore && score >= 0.6) {
          bestScore = score;
          bestMatch = { idx: i, item: g };
        }
      }

      if (bestMatch) {
        tp++;
        matchedGt.add(bestMatch.idx);
        const g = bestMatch.item;

        perField.title.total++;
        if (bestScore >= 0.85) perField.title.correct++;

        if (pItem.assignee || g.assignee) {
          perField.assignee.total++;
          if (pItem.assignee_pending && !g.assignee) {
            perField.assignee.pendingCorrect++;
          }
          if (pItem.assignee === g.assignee) perField.assignee.correct++;
        }

        if (pItem.deadline || g.deadline) {
          perField.deadline.total++;
          if (pItem.deadline_pending && !g.deadline) {
            perField.deadline.pendingCorrect++;
          }
          if (pItem.deadline === g.deadline) perField.deadline.correct++;
        }

        if (pItem.is_milestone !== undefined || g.is_milestone) {
          perField.milestone.total++;
          if (Boolean(pItem.is_milestone) === Boolean(g.is_milestone)) perField.milestone.correct++;
        }
      } else {
        fp++;
      }
    }

    for (let i = 0; i < gtItems.length; i++) {
      if (!matchedGt.has(i)) fn++;
    }
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const fieldAccuracy = {};
  for (const [field, stat] of Object.entries(perField)) {
    fieldAccuracy[field] = {
      accuracy: stat.total > 0 ? stat.correct / stat.total : 0,
      total: stat.total,
      correct: stat.correct,
      ...(stat.pendingTotal !== undefined ? {
        pendingAccuracy: stat.pendingTotal > 0 ? stat.pendingCorrect / stat.pendingTotal : 0,
        pendingCorrect: stat.pendingCorrect,
        pendingTotal: stat.pendingTotal,
      } : {}),
    };
  }

  return {
    overall: { tp, fp, fn, precision, recall, f1 },
    per_field: fieldAccuracy,
    sample_count: predictions.length,
  };
}

function _titleSimilarity(a, b) {
  if (!a || !b) return 0;
  const sa = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  const sb = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  const union = sa.size + sb.size - inter;
  return union > 0 ? inter / union : 0;
}

module.exports = {
  registerModel,
  listModels,
  getModel,
  getActiveModel,
  promoteModel,
  deleteModel,
  createTrainingTask,
  listTrainingTasks,
  getTrainingTask,
  updateTrainingProgress,
  createDataset,
  listDatasets,
  getDataset,
  createValidationRun,
  listValidationRuns,
  getValidationRun,
  completeValidationRun,
  computeMetrics,
};
