/**
 * 行动项服务（创建、查询、确认、复核）
 */
const { getDb } = require('../db');
const logger = require('../utils/logger');
const { uuid, now, parseJsonSafe } = require('../utils/common');
const audit = require('../audit');
const rollback = require('../rollback');
const queue = require('../queue');

function saveExtractionResult(meetingId, extractionResult, meta = {}) {
  const db = getDb();
  const { topics = [], action_items = [], speakers = [], warnings = [] } = extractionResult;

  const tx = db.transaction(() => {
    const topicStmt = db.prepare(`
      INSERT INTO topics (id, meeting_id, title, description, start_segment_index, end_segment_index, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of topics) {
      topicStmt.run(uuid(), meetingId, t.title, t.description, t.start_segment_index, t.end_segment_index, now());
    }

    const segMap = _buildSegmentMap(db, meetingId);

    if (speakers && speakers.length > 0) {
      const existingSpeakers = db.prepare('SELECT * FROM speakers WHERE meeting_id = ?').all(meetingId);
      for (const s of speakers) {
        const match = existingSpeakers.find(es =>
          es.raw_alias === s.raw_alias || es.speaker_name === s.raw_alias || es.speaker_name === s.normalized_name
        );
        if (match && s.normalized_name && match.confirmed === 0) {
          db.prepare('UPDATE speakers SET speaker_name = ?, speaker_role = ? WHERE id = ?')
            .run(s.normalized_name, s.role_hint || match.speaker_role, match.id);
        }
      }
    }

    const actStmt = db.prepare(`
      INSERT INTO action_items (
        id, meeting_id, segment_id, title, description, assignee, assignee_confidence,
        assignee_pending, assignee_note, deadline, deadline_confidence, deadline_pending,
        deadline_note, priority, status, is_milestone, milestone_confidence, milestone_note,
        project_name, extracted_model, extraction_confidence, needs_review, review_reason,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'extracted', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const reviewStmt = db.prepare(`
      INSERT INTO review_tasks (id, action_item_id, field_type, current_value, suggested_value, confidence, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
    `);

    for (const item of action_items) {
      const segId = item.related_segment_index !== undefined && segMap[item.related_segment_index]
        ? segMap[item.related_segment_index]
        : null;
      const itemId = uuid();
      actStmt.run(
        itemId,
        meetingId,
        segId,
        item.title,
        item.description,
        item.assignee,
        item.assignee_confidence ?? 0,
        item.assignee_pending ? 1 : 0,
        item.assignee_note,
        item.deadline,
        item.deadline_confidence ?? 0,
        item.deadline_pending ? 1 : 0,
        item.deadline_note,
        item.priority || 'medium',
        item.is_milestone ? 1 : 0,
        item.milestone_confidence ?? 0,
        item.milestone_note,
        item.project_name,
        meta.model || null,
        item.extraction_confidence ?? null,
        item.needs_review ? 1 : 0,
        item.review_reason,
        now(),
        now()
      );

      if (item.assignee_pending) {
        reviewStmt.run(uuid(), itemId, 'assignee', item.assignee, null, item.assignee_confidence ?? 0, now());
      }
      if (item.deadline_pending) {
        reviewStmt.run(uuid(), itemId, 'deadline', item.deadline, null, item.deadline_confidence ?? 0, now());
      }
      if (!item.is_milestone && (item.milestone_confidence ?? 0) >= 0.5) {
        reviewStmt.run(uuid(), itemId, 'milestone', '0', '1', item.milestone_confidence, now());
      }

      audit.log(audit.ENTITY_TYPES.ACTION_ITEM, itemId, audit.ACTIONS.EXTRACT, {
        newValue: { title: item.title, assignee: item.assignee, deadline: item.deadline },
        operatorName: 'ai-extractor',
      });
    }

    db.prepare(`UPDATE meetings SET status = 'extracted', updated_at = ? WHERE id = ?`)
      .run(now(), meetingId);
  });

  tx();
  logger.info(`[action] Saved extraction for meeting ${meetingId}: ${action_items.length} items, ${topics.length} topics`);
  return { actionCount: action_items.length, topicCount: topics.length };
}

function _buildSegmentMap(db, meetingId) {
  const rows = db.prepare('SELECT id, segment_index FROM transcript_segments WHERE meeting_id = ?').all(meetingId);
  const map = {};
  for (const r of rows) map[r.segment_index] = r.id;
  return map;
}

function listActionItems(opts = {}) {
  const db = getDb();
  const {
    meetingId = null, assignee = null, status = null, needsReview = null,
    isMilestone = null, project = null, deadlineFrom = null, deadlineTo = null,
    limit = 100, offset = 0,
  } = opts;

  let sql = 'SELECT * FROM action_items WHERE 1=1';
  const params = [];

  if (meetingId) { sql += ' AND meeting_id = ?'; params.push(meetingId); }
  if (assignee) { sql += ' AND assignee = ?'; params.push(assignee); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (needsReview !== null) { sql += ' AND needs_review = ?'; params.push(needsReview ? 1 : 0); }
  if (isMilestone !== null) { sql += ' AND is_milestone = ?'; params.push(isMilestone ? 1 : 0); }
  if (project) { sql += ' AND project_name = ?'; params.push(project); }
  if (deadlineFrom) { sql += ' AND deadline >= ?'; params.push(deadlineFrom); }
  if (deadlineTo) { sql += ' AND deadline <= ?'; params.push(deadlineTo); }

  sql += ' ORDER BY is_milestone DESC, priority ASC, deadline ASC, created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(sql).all(...params);
}

function getActionItem(id) {
  return getDb().prepare('SELECT * FROM action_items WHERE id = ?').get(id);
}

function confirmAssignee(actionItemId, assignee, operatorName = 'system') {
  return _updateField(actionItemId, 'assignee', assignee, {
    pendingField: 'assignee_pending',
    noteField: 'assignee_note',
    operatorName,
  });
}

function confirmDeadline(actionItemId, deadline, operatorName = 'system') {
  return _updateField(actionItemId, 'deadline', deadline, {
    pendingField: 'deadline_pending',
    noteField: 'deadline_note',
    operatorName,
  });
}

function updateActionItem(actionItemId, patch, operatorName = 'system') {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM action_items WHERE id = ?').get(actionItemId);
  if (!existing) throw new Error('Action item not found');

  rollback.snapshot(audit.ENTITY_TYPES.ACTION_ITEM, actionItemId, 'manual-update', null);

  const allowed = ['title', 'description', 'assignee', 'deadline', 'priority', 'status', 'is_milestone', 'project_name'];
  const sets = [];
  const values = [];
  for (const k of allowed) {
    if (patch[k] !== undefined) {
      sets.push(`${k} = ?`);
      values.push(patch[k]);
    }
  }
  if (sets.length === 0) return existing;

  if (patch.assignee !== undefined) { sets.push('assignee_pending = 0'); sets.push('assignee_confidence = 1.0'); }
  if (patch.deadline !== undefined) { sets.push('deadline_pending = 0'); sets.push('deadline_confidence = 1.0'); }

  const reviewReasons = _recalcReviewReasons({ ...existing, ...patch });
  sets.push('needs_review = ?, review_reason = ?');
  values.push(reviewReasons.needsReview ? 1 : 0);
  values.push(reviewReasons.reason);

  sets.push('updated_at = ?');
  values.push(now(), actionItemId);
  db.prepare(`UPDATE action_items SET ${sets.join(', ')} WHERE id = ?`).run(...values);

  audit.log(audit.ENTITY_TYPES.ACTION_ITEM, actionItemId, audit.ACTIONS.UPDATE, {
    oldValue: Object.fromEntries(allowed.map(k => [k, existing[k]])),
    newValue: patch,
    operatorName,
  });

  const updated = getActionItem(actionItemId);
  if (updated.status === 'confirmed' || (updated.assignee && updated.deadline && !updated.needs_review)) {
    queue.addJob(queue.QUEUE_NAMES.TASK_SYNC, { actionItemId });
  }

  return updated;
}

function _updateField(actionItemId, field, value, opts) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM action_items WHERE id = ?').get(actionItemId);
  if (!existing) throw new Error('Action item not found');

  rollback.snapshot(audit.ENTITY_TYPES.ACTION_ITEM, actionItemId, `confirm-${field}`, null);

  db.prepare(`
    UPDATE action_items 
    SET ${field} = ?, ${opts.pendingField} = 0, ${opts.noteField} = NULL, updated_at = ? 
    WHERE id = ?
  `).run(value, now(), actionItemId);

  const updated = getActionItem(actionItemId);
  const reviewReasons = _recalcReviewReasons(updated);
  db.prepare('UPDATE action_items SET needs_review = ?, review_reason = ? WHERE id = ?')
    .run(reviewReasons.needsReview ? 1 : 0, reviewReasons.reason, actionItemId);

  _resolveReviewTask(actionItemId, field, value);

  audit.log(audit.ENTITY_TYPES.ACTION_ITEM, actionItemId, audit.ACTIONS.CONFIRM, {
    oldValue: { [field]: existing[field] },
    newValue: { [field]: value },
    operatorName: opts.operatorName,
  });

  const final = getActionItem(actionItemId);
  if (!final.needs_review) {
    queue.addJob(queue.QUEUE_NAMES.TASK_SYNC, { actionItemId });
  }

  return final;
}

function _recalcReviewReasons(item) {
  const reasons = [];
  if (item.assignee_pending) reasons.push(`负责人待确认: ${item.assignee_note}`);
  if (item.deadline_pending) reasons.push(`截止日期待确认: ${item.deadline_note}`);
  if (!item.title || item.title.length < 2) reasons.push('标题不完整');
  return {
    needsReview: reasons.length > 0,
    reason: reasons.length ? reasons.join('；') : null,
  };
}

function _resolveReviewTask(actionItemId, fieldType, finalValue) {
  const db = getDb();
  const tasks = db.prepare(`
    SELECT * FROM review_tasks 
    WHERE action_item_id = ? AND field_type = ? AND status = 'pending'
  `).all(actionItemId, fieldType);
  for (const t of tasks) {
    db.prepare(`
      UPDATE review_tasks SET status = 'resolved', suggested_value = ?, completed_at = ? WHERE id = ?
    `).run(finalValue, now(), t.id);
    audit.log(audit.ENTITY_TYPES.REVIEW_TASK, t.id, audit.ACTIONS.REVIEW, {
      newValue: { status: 'resolved', finalValue },
      operatorName: 'system',
    });
  }
}

function listReviewTasks(opts = {}) {
  const db = getDb();
  const { status = 'pending', fieldType = null, limit = 100, offset = 0 } = opts;
  let sql = `
    SELECT rt.*, ai.title AS action_title, ai.meeting_id, m.title AS meeting_title
    FROM review_tasks rt
    LEFT JOIN action_items ai ON rt.action_item_id = ai.id
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { sql += ' AND rt.status = ?'; params.push(status); }
  if (fieldType) { sql += ' AND rt.field_type = ?'; params.push(fieldType); }
  sql += ' ORDER BY rt.created_at ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

function getStats() {
  const db = getDb();
  return {
    meetings: {
      total: db.prepare('SELECT COUNT(*) AS c FROM meetings').get().c,
      extracted: db.prepare("SELECT COUNT(*) AS c FROM meetings WHERE status = 'extracted'").get().c,
      imported: db.prepare("SELECT COUNT(*) AS c FROM meetings WHERE status = 'imported'").get().c,
    },
    actionItems: {
      total: db.prepare('SELECT COUNT(*) AS c FROM action_items').get().c,
      needsReview: db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE needs_review = 1').get().c,
      milestones: db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE is_milestone = 1').get().c,
      pendingAssignee: db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE assignee_pending = 1').get().c,
      pendingDeadline: db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE deadline_pending = 1').get().c,
    },
    reviewTasks: {
      pending: db.prepare("SELECT COUNT(*) AS c FROM review_tasks WHERE status = 'pending'").get().c,
      resolved: db.prepare("SELECT COUNT(*) AS c FROM review_tasks WHERE status = 'resolved'").get().c,
    },
  };
}

module.exports = {
  saveExtractionResult,
  listActionItems,
  getActionItem,
  confirmAssignee,
  confirmDeadline,
  updateActionItem,
  listReviewTasks,
  getStats,
};
