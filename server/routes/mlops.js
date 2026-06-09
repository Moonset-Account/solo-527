const express = require('express');
const router = express.Router();
const { ok, fail, asyncHandler } = require('../utils/common');
const modelSvc = require('../services/modelService');
const sampleSvc = require('../services/sampleValidationService');
const audit = require('../audit');
const rollback = require('../rollback');
const queue = require('../queue');
const syncSvc = require('../services/taskSyncService');
const monitoring = require('../monitoring');

router.get('/models', asyncHandler(async (req, res) => {
  ok(res, { items: modelSvc.listModels() });
}));

router.post('/models/register', asyncHandler(async (req, res) => {
  try {
    const { name, version, provider = 'openai', description, metrics } = req.body;
    if (!name || !version) return fail(res, 'name 和 version 是必填项', 400, 400);
    const m = modelSvc.registerModel({
      name, version, provider, description,
      metrics: metrics || { precision: null, recall: null, f1: null },
      operatorName: req.body.operator || 'api',
    });
    ok(res, m, '模型注册成功');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.get('/models/:id', asyncHandler(async (req, res) => {
  const m = modelSvc.getModel(req.params.id);
  if (!m) return fail(res, 'Model not found', 404, 404);
  ok(res, m);
}));

router.get('/models/active/current', asyncHandler(async (req, res) => {
  ok(res, modelSvc.getActiveModel());
}));

router.post('/models/:id/promote', asyncHandler(async (req, res) => {
  try {
    const m = modelSvc.promoteModel(req.params.id, req.body.operator || 'api');
    ok(res, m, '模型已提升为活跃版本');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.delete('/models/:id', asyncHandler(async (req, res) => {
  modelSvc.deleteModel(req.params.id, req.query.operator || 'api');
  ok(res, { id: req.params.id });
}));

router.get('/training-tasks', asyncHandler(async (req, res) => {
  ok(res, { items: modelSvc.listTrainingTasks(parseInt(req.query.limit) || 50) });
}));

router.post('/training-tasks', asyncHandler(async (req, res) => {
  try {
    const t = modelSvc.createTrainingTask({
      modelName: req.body.model_name,
      datasetId: req.body.dataset_id || null,
      hyperparams: req.body.hyperparams || {},
      operatorName: req.body.operator || 'api',
    });
    ok(res, t, '训练任务已创建并进入队列');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.get('/training-tasks/:id', asyncHandler(async (req, res) => {
  const t = modelSvc.getTrainingTask(req.params.id);
  if (!t) return fail(res, 'Training task not found', 404, 404);
  ok(res, t);
}));

router.get('/datasets', asyncHandler(async (req, res) => {
  ok(res, { items: modelSvc.listDatasets(req.query.type || null) });
}));

router.post('/datasets', asyncHandler(async (req, res) => {
  const { name, type, sample_count, description, version } = req.body;
  if (!name || !type) return fail(res, 'name 和 type 是必填项', 400, 400);
  const d = modelSvc.createDataset({
    name, type,
    sampleCount: sample_count || 0,
    description, version: version || '1.0',
  });
  ok(res, d, '数据集已创建');
}));

router.get('/validation-runs', asyncHandler(async (req, res) => {
  ok(res, { items: modelSvc.listValidationRuns(req.query.model_id || null) });
}));

router.post('/validation-runs', asyncHandler(async (req, res) => {
  try {
    const { model_id, dataset_id, sample_ids } = req.body;
    if (!model_id || !dataset_id) return fail(res, 'model_id 和 dataset_id 必填', 400, 400);
    const run = modelSvc.createValidationRun(model_id, dataset_id);
    if (sample_ids && sample_ids.length) {
      await queue.addJob(queue.QUEUE_NAMES.VALIDATION, {
        validationRunId: run.id, modelId: model_id, datasetId: dataset_id, sampleIds: sample_ids,
      });
    }
    ok(res, run, '验证运行已创建并进入队列');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.get('/validation-runs/:id', asyncHandler(async (req, res) => {
  const r = modelSvc.getValidationRun(req.params.id);
  if (!r) return fail(res, 'Validation run not found', 404, 404);
  ok(res, r);
}));

router.get('/samples', asyncHandler(async (req, res) => {
  ok(res, { items: sampleSvc.listSamples({
    tag: req.query.tag || null,
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0,
  })});
}));

router.post('/samples', asyncHandler(async (req, res) => {
  const s = sampleSvc.createSample(req.body);
  ok(res, s);
}));

router.get('/samples/:id', asyncHandler(async (req, res) => {
  const s = sampleSvc.getSample(req.params.id);
  if (!s) return fail(res, 'Sample not found', 404, 404);
  ok(res, s);
}));

router.patch('/samples/:id', asyncHandler(async (req, res) => {
  try {
    const s = sampleSvc.updateSample(req.params.id, req.body);
    ok(res, s);
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.delete('/samples/:id', asyncHandler(async (req, res) => {
  sampleSvc.deleteSample(req.params.id);
  ok(res, { id: req.params.id });
}));

router.post('/samples/import', asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.samples)) return fail(res, 'samples 必须是数组', 400, 400);
  const results = sampleSvc.importSamplesFromJson(req.body.samples, req.body.tag || 'imported');
  ok(res, { results, total: results.length });
}));

router.get('/samples/:id/explain', asyncHandler(async (req, res) => {
  try {
    const opts = {};
    if (req.query.model) opts.useModel = req.query.model;
    const explanation = await sampleSvc.explainSamplePrediction(req.params.id, opts);
    ok(res, explanation);
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.post('/samples/validate', asyncHandler(async (req, res) => {
  try {
    const { model_id, dataset_id, sample_ids } = req.body;
    if (!model_id || !dataset_id || !Array.isArray(sample_ids)) {
      return fail(res, 'model_id, dataset_id, sample_ids 必填', 400, 400);
    }
    const result = await sampleSvc.validateDataset(model_id, dataset_id, sample_ids);
    ok(res, result, '验证完成');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.get('/audit-logs', asyncHandler(async (req, res) => {
  const { entity_type, entity_id, limit, offset } = req.query;
  const logs = audit.query(
    entity_type || null,
    entity_id || null,
    parseInt(limit) || 100,
    parseInt(offset) || 0
  );
  ok(res, { items: logs });
}));

router.post('/rollback/snapshot', asyncHandler(async (req, res) => {
  try {
    const { entity_type, entity_id, reason } = req.body;
    if (!entity_type || !entity_id) return fail(res, 'entity_type 和 entity_id 必填', 400, 400);
    const id = rollback.snapshot(entity_type, entity_id, reason || null, req.body.operator_id || null);
    ok(res, { snapshot_id: id }, '快照已创建');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.post('/rollback/execute', asyncHandler(async (req, res) => {
  try {
    const { snapshot_id } = req.body;
    if (!snapshot_id) return fail(res, 'snapshot_id 必填', 400, 400);
    const result = rollback.rollback(snapshot_id, req.body.operator_id || null, req.body.operator || 'api');
    ok(res, { result }, '回滚成功');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.get('/rollback/list', asyncHandler(async (req, res) => {
  ok(res, { items: rollback.listRollbacks(req.query.entity_type || null, req.query.entity_id || null) });
}));

router.get('/queue/stats', asyncHandler(async (req, res) => {
  const stats = await queue.getAllQueueStats();
  ok(res, stats);
}));

router.get('/sync/adapters', asyncHandler(async (req, res) => {
  ok(res, { adapters: syncSvc.listAvailableAdapters() });
}));

router.post('/sync/action/:id', asyncHandler(async (req, res) => {
  try {
    const target = req.body.target_system || 'mock';
    const result = await syncSvc.syncActionItem(req.params.id, target, req.body.config || {});
    ok(res, result, result.status === 'success' ? '同步成功' : '同步失败');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.get('/sync/logs', asyncHandler(async (req, res) => {
  ok(res, { items: syncSvc.listSyncLogs(req.query.action_item_id || null) });
}));

module.exports = router;
