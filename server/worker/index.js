/**
 * Bull 队列 Worker 处理器
 * 独立进程运行：npm run worker
 */
const logger = require('../utils/logger');
const queueManager = require('../queue');
const { QUEUE_NAMES, getQueue, _checkRedis } = require('../queue');
const { getDb } = require('../db');
const { now } = require('../utils/common');
const cleaner = require('../services/dataCleaning');
const extraction = require('../services/extractionService');
const actionSvc = require('../services/actionItemService');
const meetingSvc = require('../services/meetingService');
const modelSvc = require('../services/modelService');
const syncSvc = require('../services/taskSyncService');
const sampleSvc = require('../services/sampleValidationService');
const monitoring = require('../monitoring');
const config = require('../config');

async function startAllWorkers() {
  logger.info('[worker] Starting all queue workers...');
  await _checkRedis();

  _registerTranscriptParse();
  _registerActionExtract();
  _registerTaskSync();
  _registerTraining();
  _registerValidation();

  logger.info('[worker] All workers registered');
}

function _registerTranscriptParse() {
  const q = getQueue(QUEUE_NAMES.TRANSCRIPT_PARSE, { concurrency: 4 });
  q.process(async (job) => {
    const { meetingId } = job.data;
    const db = getDb();

    logger.info(`[worker:transcript] Processing meeting ${meetingId}`);
    const detail = meetingSvc.getMeetingDetail(meetingId);
    if (!detail) throw new Error(`Meeting ${meetingId} not found`);

    const segments = detail.segments.map(s => ({
      speaker: s.speaker_name || '',
      content: s.content,
      start_time: s.start_time,
      end_time: s.end_time,
    }));
    const topics = cleaner.detectTopics(segments);

    if (topics.length > 0) {
      const tx = db.transaction(() => {
        const existingTopics = db.prepare('SELECT id FROM topics WHERE meeting_id = ?').all(meetingId);
        if (existingTopics.length === 0) {
          const stmt = db.prepare(`
            INSERT INTO topics (id, meeting_id, title, description, start_segment_index, end_segment_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          for (const t of topics) {
            const crypto = require('crypto');
            stmt.run(
              crypto.randomUUID ? crypto.randomUUID() : require('uuid').v4(),
              meetingId,
              t.title,
              t.description || null,
              t.start_segment_index,
              t.end_segment_index,
              now()
            );
          }
        }
      });
      tx();
    }

    db.prepare("UPDATE meetings SET status = 'parsed', updated_at = ? WHERE id = ? AND status = 'imported'")
      .run(now(), meetingId);

    await queueManager.addJob(QUEUE_NAMES.ACTION_EXTRACT, { meetingId }, { delay: 200 });

    return { meetingId, topics: topics.length, segments: segments.length };
  });
}

function _registerActionExtract() {
  const q = getQueue(QUEUE_NAMES.ACTION_EXTRACT, { concurrency: 2 });
  q.process(async (job) => {
    const { meetingId } = job.data;
    const db = getDb();

    logger.info(`[worker:extract] Extracting actions for meeting ${meetingId}`);
    const detail = meetingSvc.getMeetingDetail(meetingId);
    if (!detail) throw new Error(`Meeting ${meetingId} not found`);

    const existing = db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE meeting_id = ?').get(meetingId).c;
    if (existing > 0) {
      logger.warn(`[worker:extract] Meeting ${meetingId} already has ${existing} action items, skipping`);
      return { skipped: true, reason: 'already_extracted' };
    }

    const segments = detail.segments.map(s => ({
      speaker: s.speaker_name || '',
      content: s.content,
      start_time: s.start_time,
      end_time: s.end_time,
    }));

    const activeModel = modelSvc.getActiveModel();
    const modelName = activeModel ? activeModel.name : config.openai.model;

    const start = Date.now();
    let result;
    try {
      result = await extraction.extractActionItems({
        meetingTitle: detail.title,
        projectName: detail.project_name,
        meetingDate: detail.meeting_date,
        segments,
      }, { useModel: modelName });
    } catch (err) {
      db.prepare("UPDATE meetings SET status = 'extract_failed', updated_at = ? WHERE id = ?")
        .run(now(), meetingId);
      throw err;
    }
    const latency = (Date.now() - start) / 1000;

    const meta = result._meta || { model: modelName };
    delete result._meta;
    actionSvc.saveExtractionResult(meetingId, result, meta);

    monitoring.recordExtraction(modelName, true, latency);
    const stats = actionSvc.getStats();
    monitoring.setPendingAssigneeCount(stats.actionItems.pendingAssignee);

    return {
      meetingId,
      actionCount: result.action_items?.length || 0,
      topicCount: result.topics?.length || 0,
      latency,
      model: modelName,
    };
  });
}

function _registerTaskSync() {
  const q = getQueue(QUEUE_NAMES.TASK_SYNC, { concurrency: 5 });
  q.process(async (job) => {
    const { actionItemId, targetSystem = 'mock' } = job.data;
    logger.info(`[worker:sync] Syncing action ${actionItemId} -> ${targetSystem}`);
    const result = await syncSvc.syncActionItem(actionItemId, targetSystem);
    return result;
  });
}

function _registerTraining() {
  const q = getQueue(QUEUE_NAMES.TRAINING, { concurrency: 1 });
  q.process(async (job) => {
    const { trainingTaskId } = job.data;
    logger.info(`[worker:training] Starting training ${trainingTaskId}`);

    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      await new Promise(r => setTimeout(r, 150));
      modelSvc.updateTrainingProgress(trainingTaskId, Math.round((i / steps) * 100), i === 1 ? 'running' : null);
      job.progress(Math.round((i / steps) * 100));
    }
    modelSvc.updateTrainingProgress(trainingTaskId, 100, 'completed');

    logger.info(`[worker:training] Training ${trainingTaskId} completed`);
    return { trainingTaskId, completed: true };
  });
}

function _registerValidation() {
  const q = getQueue(QUEUE_NAMES.VALIDATION, { concurrency: 1 });
  q.process(async (job) => {
    const { validationRunId, modelId, datasetId, sampleIds } = job.data;
    logger.info(`[worker:validation] Run ${validationRunId} starting`);

    const run = modelSvc.getValidationRun(validationRunId);
    if (!run) throw new Error(`Validation run ${validationRunId} not found`);

    const samples = sampleIds && sampleIds.length
      ? sampleIds
      : (sampleSvc.listSamples({ limit: 50 }).map(s => s.id));

    const result = await sampleSvc.validateDataset(
      modelId || run.model_id,
      datasetId || run.dataset_id,
      samples
    );

    return result;
  });
}

if (require.main === module) {
  (async () => {
    await require('../db').initDb();
    await startAllWorkers();
    logger.info('[worker] Worker process started');
  })();
}

module.exports = { startAllWorkers };
