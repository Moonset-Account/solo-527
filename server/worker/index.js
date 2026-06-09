/**
 * Bull 队列 Worker 处理器
 * 独立进程运行：npm run worker
 */
const logger = require('../utils/logger');
const queueManager = require('../queue');
const { QUEUE_NAMES, getQueue, _checkRedis } = require('../queue');
const { getDb } = require('../db');
const { now, uuid } = require('../utils/common');
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

  try {
    const db = getDb();
    const pending = db.prepare(
      "SELECT id, title, status FROM meetings WHERE status IN ('imported', 'parsed', 'extract_failed')"
    ).all();
    if (pending.length > 0) {
      logger.info(`[worker:auto-recover] Found ${pending.length} unfinished meetings, re-queuing...`);
      for (const m of pending) {
        logger.info(`  - ${(m.title || '').slice(0, 30)}  id=${m.id.slice(0, 8)}...  status=${m.status}`);
        if (m.status === 'imported') {
          await queueManager.addJob(QUEUE_NAMES.TRANSCRIPT_PARSE, { meetingId: m.id, trigger: 'auto-recover' });
        } else {
          const acts = db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE meeting_id = ?').get(m.id).c;
          if (acts === 0 || m.status === 'extract_failed') {
            db.prepare('DELETE FROM topics WHERE meeting_id = ?').run(m.id);
            await queueManager.addJob(QUEUE_NAMES.ACTION_EXTRACT, { meetingId: m.id, trigger: 'auto-recover' });
          }
        }
      }
      logger.info('[worker:auto-recover] Re-queue done.');
    }
  } catch (e) {
    logger.warn('[worker:auto-recover] skip: ' + e.message);
  }
}

function _registerTranscriptParse() {
  const q = getQueue(QUEUE_NAMES.TRANSCRIPT_PARSE, { concurrency: 4 });
  q.process(async (job) => {
    const { meetingId } = job.data;
    const db = getDb();

    logger.info(`[worker:transcript] Processing meeting ${meetingId}`);
    const detail = meetingSvc.getMeetingDetail(meetingId);
    if (!detail) throw new Error(`Meeting ${meetingId} not found`);

    const segCount = (detail.segments || []).length;
    if (segCount === 0 && detail.raw_source) {
      logger.warn(`[worker:transcript] Meeting ${meetingId} has 0 segments, re-parsing raw_source...`);
      try {
        const rawContent = detail.raw_source;
        const fmt = (detail.metadata && detail.metadata.format) ? detail.metadata.format : 'auto';
        const parsed = cleaner.parseTranscript(rawContent, fmt);
        logger.info(`[worker:transcript] Re-parsed: ${parsed.segments.length} segments, format=${parsed.format}`);

        const speakersMap = new Map();
        for (const s of parsed.segments) {
          if (s.speaker && !speakersMap.has(s.speaker)) {
            speakersMap.set(s.speaker, {
              id: uuid(),
              name: s.speaker,
              role: s.speaker_role || null,
              rawAlias: s.speaker,
              confirmed: 0,
            });
          }
        }

        const speakerStmt = db.prepare(
          'INSERT INTO speakers (id, meeting_id, speaker_name, speaker_role, raw_alias, confirmed, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        for (const sp of speakersMap.values()) {
          speakerStmt.run(sp.id, meetingId, sp.name, sp.role, sp.rawAlias, sp.confirmed, now());
        }

        const segStmt = db.prepare(
          'INSERT INTO transcript_segments (id, meeting_id, speaker_id, segment_index, start_time, end_time, content, topic_tag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (let i = 0; i < parsed.segments.length; i++) {
          const s = parsed.segments[i];
          const speakerObj = s.speaker ? speakersMap.get(s.speaker) : null;
          segStmt.run(uuid(), meetingId, speakerObj ? speakerObj.id : null, i, s.start_time, s.end_time, s.content, null, now());
        }

        logger.info(`[worker:transcript] Re-parse done: ${speakersMap.size} speakers, ${parsed.segments.length} segments restored.`);
      } catch (e) {
        logger.error(`[worker:transcript] Re-parse failed: ${e.message}`);
      }
    }

    const rows = db.prepare(
      'SELECT ts.*, sp.speaker_name FROM transcript_segments ts LEFT JOIN speakers sp ON ts.speaker_id = sp.id WHERE ts.meeting_id = ? ORDER BY ts.segment_index'
    ).all(meetingId);
    const segments = rows.map(s => ({
      speaker: s.speaker_name || '',
      content: s.content,
      start_time: s.start_time,
      end_time: s.end_time,
    }));
    const topics = cleaner.detectTopics(segments);

    const existingTopics = db.prepare('SELECT id FROM topics WHERE meeting_id = ?').all(meetingId);
    if (topics.length > 0 && existingTopics.length === 0) {
      const topicStmt = db.prepare(
        'INSERT INTO topics (id, meeting_id, title, description, start_segment_index, end_segment_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const t of topics) {
        topicStmt.run(uuid(), meetingId, t.title, t.description || null, t.start_segment_index, t.end_segment_index, now());
      }
    }

    db.prepare("UPDATE meetings SET status = 'parsed', updated_at = ? WHERE id = ? AND status = 'imported'").run(now(), meetingId);

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

    const segments = (detail.segments || []).map(s => ({
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
      db.prepare("UPDATE meetings SET status = 'extract_failed', updated_at = ? WHERE id = ?").run(now(), meetingId);
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
      actionCount: (result.action_items || []).length,
      topicCount: (result.topics || []).length,
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
