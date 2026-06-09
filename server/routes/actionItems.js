const express = require('express');
const router = express.Router();
const { ok, fail, asyncHandler } = require('../utils/common');
const actionSvc = require('../services/actionItemService');
const workbench = require('../services/annotationWorkbench');

router.get('/', asyncHandler(async (req, res) => {
  const opts = {};
  if (req.query.meeting_id) opts.meetingId = req.query.meeting_id;
  if (req.query.assignee) opts.assignee = req.query.assignee;
  if (req.query.status) opts.status = req.query.status;
  if (req.query.needs_review !== undefined) opts.needsReview = req.query.needs_review === '1' || req.query.needs_review === 'true';
  if (req.query.is_milestone !== undefined) opts.isMilestone = req.query.is_milestone === '1' || req.query.is_milestone === 'true';
  if (req.query.project) opts.project = req.query.project;
  if (req.query.deadline_from) opts.deadlineFrom = req.query.deadline_from;
  if (req.query.deadline_to) opts.deadlineTo = req.query.deadline_to;
  opts.limit = parseInt(req.query.limit) || 100;
  opts.offset = parseInt(req.query.offset) || 0;

  ok(res, { items: actionSvc.listActionItems(opts) });
}));

router.get('/stats', asyncHandler(async (req, res) => {
  ok(res, actionSvc.getStats());
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const item = actionSvc.getActionItem(req.params.id);
  if (!item) return fail(res, 'Action item not found', 404, 404);
  ok(res, item);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  try {
    const updated = actionSvc.updateActionItem(req.params.id, req.body, req.body.operator || 'api');
    ok(res, updated);
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.post('/:id/confirm-assignee', asyncHandler(async (req, res) => {
  try {
    if (!req.body.assignee) return fail(res, 'assignee 不能为空', 400, 400);
    const updated = actionSvc.confirmAssignee(req.params.id, req.body.assignee, req.body.operator || 'api');
    ok(res, updated, '负责人已确认');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.post('/:id/confirm-deadline', asyncHandler(async (req, res) => {
  try {
    if (!req.body.deadline) return fail(res, 'deadline 不能为空', 400, 400);
    const updated = actionSvc.confirmDeadline(req.params.id, req.body.deadline, req.body.operator || 'api');
    ok(res, updated, '截止日期已确认');
  } catch (err) {
    fail(res, err.message, 400, 400);
  }
}));

router.get('/review-tasks/list', asyncHandler(async (req, res) => {
  const opts = {};
  if (req.query.status) opts.status = req.query.status;
  if (req.query.field_type) opts.fieldType = req.query.field_type;
  opts.limit = parseInt(req.query.limit) || 100;
  opts.offset = parseInt(req.query.offset) || 0;
  ok(res, { items: actionSvc.listReviewTasks(opts) });
}));

router.get('/workbench/stats', asyncHandler(async (req, res) => {
  ok(res, workbench.getWorkbenchStats());
}));

router.get('/workbench/queue', asyncHandler(async (req, res) => {
  const opts = {};
  if (req.query.field_type) opts.fieldType = req.query.field_type;
  if (req.query.project) opts.project = req.query.project;
  opts.limit = parseInt(req.query.limit) || 50;
  opts.offset = parseInt(req.query.offset) || 0;
  ok(res, { items: workbench.getReviewQueue(opts) });
}));

router.post('/workbench/batch-review', asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.updates)) return fail(res, 'updates 必须是数组', 400, 400);
  const results = workbench.batchReview(req.body.updates, req.body.operator || 'api');
  const successCount = results.filter(r => r.success).length;
  ok(res, { results, success_count: successCount, total: results.length }, `处理完成: ${successCount}/${results.length}`);
}));

router.get('/workbench/consistency', asyncHandler(async (req, res) => {
  ok(res, workbench.checkConsistency(req.query.project || null));
}));

router.post('/workbench/export-samples', asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.ids)) return fail(res, 'ids 必须是数组', 400, 400);
  const samples = workbench.exportAsTrainingSample(req.body.ids);
  ok(res, { samples, count: samples.length });
}));

module.exports = router;
