/**
 * 标注工作台服务
 * 提供行动项人工标注、批量审核、标注质量检查等功能
 */
const { getDb } = require('../db');
const { uuid, now, parseJsonSafe } = require('../utils/common');
const logger = require('../utils/logger');
const audit = require('../audit');
const monitoring = require('../monitoring');
const actionSvc = require('./actionItemService');

/**
 * 获取标注工作台统计概览
 */
function getWorkbenchStats() {
  const db = getDb();
  return {
    pending_review: db.prepare("SELECT COUNT(*) AS c FROM review_tasks WHERE status = 'pending'").get().c,
    pending_assignee: db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE assignee_pending = 1 AND needs_review = 1').get().c,
    pending_deadline: db.prepare('SELECT COUNT(*) AS c FROM action_items WHERE deadline_pending = 1 AND needs_review = 1').get().c,
    pending_milestone: db.prepare(`
      SELECT COUNT(*) AS c FROM review_tasks 
      WHERE status = 'pending' AND field_type = 'milestone'
    `).get().c,
    today_extracted: db.prepare(`
      SELECT COUNT(*) AS c FROM action_items 
      WHERE DATE(created_at) = DATE('now')
    `).get().c,
    today_confirmed: db.prepare(`
      SELECT COUNT(DISTINCT entity_id) AS c FROM audit_logs 
      WHERE entity_type = 'action_item' AND action = 'confirm' AND DATE(created_at) = DATE('now')
    `).get().c,
  };
}

/**
 * 获取待审核行动项队列（按优先级排序）
 */
function getReviewQueue(opts = {}) {
  const db = getDb();
  const { fieldType = null, priority = null, limit = 50, offset = 0, project = null } = opts;

  let sql = `
    SELECT 
      ai.*,
      m.title AS meeting_title,
      m.meeting_date,
      m.project_name,
      GROUP_CONCAT(CASE WHEN rt.status = 'pending' THEN rt.field_type END, ',') AS pending_fields
    FROM action_items ai
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    LEFT JOIN review_tasks rt ON ai.id = rt.action_item_id
    WHERE ai.needs_review = 1
  `;
  const params = [];

  if (project) { sql += ' AND m.project_name = ?'; params.push(project); }

  sql += ' GROUP BY ai.id';

  if (fieldType) {
    sql += ` HAVING pending_fields LIKE ?`;
    params.push(`%${fieldType}%`);
  }

  sql += ` ORDER BY 
    CASE 
      WHEN ai.priority = 'high' THEN 1
      WHEN ai.priority = 'medium' THEN 2
      ELSE 3
    END ASC,
    ai.is_milestone DESC,
    COALESCE(ai.deadline, '9999-12-31') ASC,
    ai.created_at ASC
    LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({
    ...r,
    pending_fields: r.pending_fields ? [...new Set(r.pending_fields.split(','))] : [],
  }));
}

/**
 * 批量审核行动项
 * updates: [{ action_item_id, field_type, value }]
 */
function batchReview(updates, operatorName = 'reviewer') {
  const results = [];
  for (const u of updates) {
    try {
      let updated;
      switch (u.field_type) {
        case 'assignee':
          updated = actionSvc.confirmAssignee(u.action_item_id, u.value, operatorName);
          monitoring.recordReview('resolved', 'assignee');
          break;
        case 'deadline':
          updated = actionSvc.confirmDeadline(u.action_item_id, u.value, operatorName);
          monitoring.recordReview('resolved', 'deadline');
          break;
        case 'milestone':
          updated = actionSvc.updateActionItem(u.action_item_id, { is_milestone: u.value ? 1 : 0 }, operatorName);
          monitoring.recordReview('resolved', 'milestone');
          break;
        case 'title':
        case 'description':
        case 'priority':
          updated = actionSvc.updateActionItem(u.action_item_id, { [u.field_type]: u.value }, operatorName);
          monitoring.recordReview('resolved', u.field_type);
          break;
        default:
          throw new Error(`Unknown field_type: ${u.field_type}`);
      }
      results.push({ action_item_id: u.action_item_id, field_type: u.field_type, success: true, updated });
    } catch (err) {
      results.push({ action_item_id: u.action_item_id, field_type: u.field_type, success: false, error: err.message });
    }
  }
  logger.info(`[workbench] Batch review: ${results.filter(r => r.success).length}/${results.length} successful by ${operatorName}`);
  return results;
}

/**
 * 基于已确认的行动项导出为训练样本
 */
function exportAsTrainingSample(actionItemIds, opts = {}) {
  const db = getDb();
  const items = actionItemIds.map(id => db.prepare(`
    SELECT ai.*, m.id AS meeting_id, m.title AS meeting_title, m.project_name, m.meeting_date, m.transcript
    FROM action_items ai
    LEFT JOIN meetings m ON ai.meeting_id = m.id
    WHERE ai.id = ?
  `).get(id)).filter(Boolean);

  const byMeeting = new Map();
  for (const item of items) {
    if (!byMeeting.has(item.meeting_id)) {
      byMeeting.set(item.meeting_id, {
        meeting_title: item.meeting_title,
        project_name: item.project_name,
        meeting_date: item.meeting_date,
        transcript: item.transcript,
        segments: [],
        expected_action_items: [],
      });
    }
    const rec = byMeeting.get(item.meeting_id);
    rec.expected_action_items.push({
      title: item.title,
      description: item.description,
      assignee: item.assignee_pending ? null : item.assignee,
      deadline: item.deadline_pending ? null : item.deadline,
      priority: item.priority,
      is_milestone: Boolean(item.is_milestone),
    });
  }

  return Array.from(byMeeting.values());
}

/**
 * 检查标注一致性（相似行动项的负责人/截止日期是否一致）
 */
function checkConsistency(project = null) {
  const db = getDb();
  const items = actionSvc.listActionItems({ project, needsReview: false, limit: 1000 });

  const issues = [];

  const byTitle = new Map();
  for (const it of items) {
    const key = it.title.slice(0, 20).toLowerCase();
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key).push(it);
  }

  for (const [key, group] of byTitle) {
    if (group.length >= 2) {
      const assignees = new Set(group.map(g => g.assignee).filter(Boolean));
      const priorities = new Set(group.map(g => g.priority));
      if (assignees.size > 1) {
        issues.push({
          type: 'inconsistent_assignee',
          severity: 'medium',
          title_key: key,
          assignees: Array.from(assignees),
          action_item_ids: group.map(g => g.id),
          description: `相似行动项存在不同负责人: ${Array.from(assignees).join(' vs ')}`,
        });
      }
      if (priorities.size > 1) {
        issues.push({
          type: 'inconsistent_priority',
          severity: 'low',
          title_key: key,
          priorities: Array.from(priorities),
          action_item_ids: group.map(g => g.id),
          description: `相似行动项存在不同优先级`,
        });
      }
    }
  }

  const noDeadlineCount = items.filter(i => !i.deadline && !i.deadline_pending && i.status !== 'completed').length;
  if (noDeadlineCount > 5) {
    issues.push({
      type: 'missing_deadline',
      severity: 'low',
      count: noDeadlineCount,
      description: `${noDeadlineCount} 个已确认行动项未设置截止日期`,
    });
  }

  return {
    total_checked: items.length,
    issues,
    issue_count: issues.length,
  };
}

module.exports = {
  getWorkbenchStats,
  getReviewQueue,
  batchReview,
  exportAsTrainingSample,
  checkConsistency,
};
