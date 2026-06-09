const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { getDb } = require('../utils/database');

function getTickets(params = {}) {
  const db = getDb();
  const {
    status, category, urgency, is_high_risk, needs_review,
    district, block, department_code,
    page = 1, pageSize = 20,
    startDate, endDate, keyword,
  } = params;

  const where = [];
  const args = [];

  if (status) { where.push('status = ?'); args.push(status); }
  if (category) { where.push('category = ?'); args.push(category); }
  if (urgency) { where.push('urgency = ?'); args.push(urgency); }
  if (district) { where.push('district = ?'); args.push(district); }
  if (block) { where.push('block = ?'); args.push(block); }
  if (department_code) { where.push('department_code = ?'); args.push(department_code); }
  if (is_high_risk !== undefined) { where.push('is_high_risk = ?'); args.push(is_high_risk ? 1 : 0); }
  if (needs_review !== undefined) { where.push('needs_review = ?'); args.push(needs_review ? 1 : 0); }
  if (startDate) { where.push('DATE(created_at) >= ?'); args.push(startDate); }
  if (endDate) { where.push('DATE(created_at) <= ?'); args.push(endDate); }
  if (keyword) {
    where.push('(content LIKE ? OR ticket_no LIKE ? OR caller_name LIKE ?)');
    const kw = `%${keyword}%`;
    args.push(kw, kw, kw);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const countSql = `SELECT COUNT(*) as cnt FROM tickets ${whereClause}`;
  const total = db.prepare(countSql).get(...args).cnt;

  const offset = (page - 1) * pageSize;
  const listSql = `
    SELECT id, ticket_no, caller_name, caller_phone, district, block, community,
           content, original_category, category, category_confidence,
           urgency, urgency_confidence, department_code, department_name, department_confidence,
           status, is_high_risk, needs_review, review_reason,
           created_at, assigned_at, closed_at, followup_score, model_version
    FROM tickets ${whereClause}
    ORDER BY is_high_risk DESC,
             CASE urgency WHEN '特急' THEN 1 WHEN '紧急' THEN 2 WHEN '一般' THEN 3 ELSE 4 END,
             created_at DESC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...args, Number(pageSize), Number(offset));

  return {
    list,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / pageSize),
  };
}

function getTicketById(id) {
  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
  if (!ticket) return null;

  const reviews = db.prepare(`
    SELECT tr.*, u.name as reviewer_name
    FROM ticket_reviews tr LEFT JOIN users u ON tr.reviewer_id = u.id
    WHERE tr.ticket_id = ? ORDER BY tr.created_at DESC
  `).all(id);

  const logs = db.prepare(`
    SELECT * FROM inference_logs WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 5
  `).all(id);

  if (ticket.raw_inference_result) {
    try { ticket.raw_inference_result = JSON.parse(ticket.raw_inference_result); } catch (e) {}
  }

  return { ...ticket, reviews, inference_logs: logs };
}

function getReviewQueue(params = {}) {
  const { review_type, review_status, page = 1, pageSize = 20 } = params;
  const db = getDb();
  const where = ['tr.review_status = ?'];
  const args = [review_status || 'pending'];

  if (review_type) { where.push('tr.review_type = ?'); args.push(review_type); }

  const countSql = `SELECT COUNT(*) as cnt FROM ticket_reviews tr ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`;
  const total = db.prepare(countSql).get(...args).cnt;

  const offset = (page - 1) * pageSize;
  const listSql = `
    SELECT tr.id, tr.ticket_id, tr.review_type, tr.review_status, tr.created_at,
           tr.original_category, tr.original_urgency, tr.original_department,
           t.ticket_no, t.content, t.district, t.block, t.urgency, t.category,
           t.category_confidence, t.department_confidence, t.urgency_confidence,
           t.is_high_risk, t.review_reason
    FROM ticket_reviews tr JOIN tickets t ON tr.ticket_id = t.id
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY t.is_high_risk DESC, tr.created_at ASC
    LIMIT ? OFFSET ?
  `;
  const list = db.prepare(listSql).all(...args, Number(pageSize), Number(offset));

  return { list, total, page: Number(page), pageSize: Number(pageSize), totalPages: Math.ceil(total / pageSize) };
}

function reviewTicket(ticketId, reviewerId, reviewAction, updates = {}) {
  const db = getDb();
  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) throw new Error('工单不存在');

    const review = db.prepare('SELECT * FROM ticket_reviews WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1').get(ticketId);
    if (!review) throw new Error('复核记录不存在');

    let status = reviewAction;
    let ticketStatus = ticket.status;
    const fields = [];
    const fargs = [];

    if (reviewAction === 'approved') {
      ticketStatus = 'auto_assigned';
    } else if (reviewAction === 'rejected') {
      ticketStatus = 'reviewing';
    } else if (reviewAction === 'modified') {
      ticketStatus = 'reassigned';
      if (updates.category) { fields.push('category = ?'); fargs.push(updates.category); }
      if (updates.urgency) { fields.push('urgency = ?'); fargs.push(updates.urgency); }
      if (updates.department_code) {
        fields.push('department_code = ?');
        fields.push('department_name = ?');
        fargs.push(updates.department_code);
        fargs.push(updates.department_name || '');
      }
    }

    if (fields.length) {
      fields.push('needs_review = 0');
      fields.push('updated_at = ?');
      fargs.push(now);
      fargs.push(ticketId);
      db.prepare(`UPDATE tickets SET ${fields.join(', ')} WHERE id = ?`).run(...fargs);
    } else {
      db.prepare(`UPDATE tickets SET status = ?, needs_review = 0, updated_at = ? WHERE id = ?`).run(ticketStatus, now, ticketId);
    }

    db.prepare(`
      UPDATE ticket_reviews SET
        reviewer_id = ?, review_status = ?,
        corrected_category = ?, corrected_urgency = ?, corrected_department = ?,
        review_comment = ?, reviewed_at = ?
      WHERE id = ?
    `).run(
      reviewerId,
      status,
      updates.category || null,
      updates.urgency || null,
      updates.department_code || null,
      updates.comment || null,
      now,
      review.id
    );

    return { ticket_id: ticketId, action: reviewAction, ticket_status: ticketStatus };
  });

  try {
    const result = tx();
    logger.info('Ticket reviewed', result);
    return result;
  } catch (e) {
    logger.error('Review failed', { error: e.message });
    throw e;
  }
}

function closeTicket(ticketId, params = {}) {
  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
  if (!ticket) throw new Error('工单不存在');
  if (ticket.is_high_risk) {
    throw new Error('高风险民生诉求不能自动关闭，必须人工确认');
  }
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tickets SET
      status = 'closed', closed_at = ?, updated_at = ?,
      review_score = ?, followup_score = ?, followup_comment = ?
    WHERE id = ?
  `).run(now, now, params.review_score || null, params.followup_score || null, params.followup_comment || null, ticketId);
  return { ticket_id: ticketId, status: 'closed' };
}

function escalateTicket(ticketId, reason, userId) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(`UPDATE tickets SET status = 'escalated', updated_at = ?, review_reason = ? WHERE id = ?`)
    .run(now, reason || '人工升级', ticketId);
  const rev = db.prepare(`SELECT * FROM ticket_reviews WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1`).get(ticketId);
  if (rev) {
    db.prepare(`UPDATE ticket_reviews SET review_status = 'pending', review_comment = ?, reviewer_id = ? WHERE id = ?`)
      .run(reason || '人工升级', userId, rev.id);
  } else {
    db.prepare(`
      INSERT INTO ticket_reviews (id, ticket_id, review_type, review_status, review_comment, reviewer_id, created_at)
      VALUES (?, ?, 'manual', 'pending', ?, ?, CURRENT_TIMESTAMP)
    `).run(uuidv4(), ticketId, reason || '人工升级', userId);
  }
  return { ticket_id: ticketId, status: 'escalated' };
}

function getDashboardStats() {
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE DATE(created_at) = DATE('now', 'localtime')").get().c;
  const auto = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'auto_assigned' AND DATE(created_at) = DATE('now', 'localtime')").get().c;
  const review = db.prepare('SELECT COUNT(*) as c FROM ticket_reviews WHERE review_status = \'pending\'').get().c;
  const highRisk = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE is_high_risk = 1 AND status != 'closed'").get().c;
  const closed = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'closed' AND DATE(closed_at) = DATE('now', 'localtime')").get().c;

  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count, AVG(category_confidence) as avg_conf
    FROM tickets GROUP BY category ORDER BY count DESC LIMIT 10
  `).all();

  const byUrgency = db.prepare(`
    SELECT urgency, COUNT(*) as count FROM tickets WHERE status != 'closed' GROUP BY urgency
  `).all();

  const byDept = db.prepare(`
    SELECT department_code, department_name, COUNT(*) as count
    FROM tickets WHERE DATE(created_at) >= DATE('now', '-7 days')
    GROUP BY department_code ORDER BY count DESC
  `).all();

  const avgConf = db.prepare(`
    SELECT
      AVG(category_confidence) as cat,
      AVG(urgency_confidence) as urg,
      AVG(department_confidence) as dept
    FROM tickets WHERE DATE(created_at) >= DATE('now', '-7 days')
  `).get();

  const reviewStats = db.prepare(`
    SELECT
      SUM(CASE WHEN review_status='approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN review_status='modified' THEN 1 ELSE 0 END) as modified,
      SUM(CASE WHEN review_status='rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN review_status='pending' THEN 1 ELSE 0 END) as pending,
      COUNT(*) as total
    FROM ticket_reviews
  `).get();

  return {
    today: { total, auto_assigned: auto, reviewing: review, high_risk: highRisk, closed },
    auto_rate: total > 0 ? Number((auto / total * 100).toFixed(1)) : 0,
    review_pending: review,
    by_category: byCategory,
    by_urgency: byUrgency,
    by_department: byDept,
    avg_confidence_7d: {
      category: Number((avgConf.cat || 0).toFixed(3)),
      urgency: Number((avgConf.urg || 0).toFixed(3)),
      department: Number((avgConf.dept || 0).toFixed(3)),
    },
    review_stats: {
      ...reviewStats,
      approve_rate: reviewStats.total > 0 ? Number((reviewStats.approved / reviewStats.total * 100).toFixed(1)) : 0,
      modify_rate: reviewStats.total > 0 ? Number((reviewStats.modified / reviewStats.total * 100).toFixed(1)) : 0,
    },
  };
}

function importHistoricalTickets(records, { buildEmbedding = false } = {}) {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR REPLACE INTO historical_tickets (
      id, ticket_no, content, category, urgency, department_code, department_name,
      district, block, community, resolution, resolution_days, followup_score,
      is_embedding_built, created_at, closed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  const tx = db.transaction((recs) => {
    for (const r of recs) {
      insert.run(
        r.id || uuidv4(),
        r.ticket_no || r.ticketNo || `HIS${Date.now()}${Math.floor(Math.random() * 1000)}`,
        r.content || r.text,
        r.category,
        r.urgency,
        r.department_code || r.departmentCode,
        r.department_name || r.departmentName,
        r.district,
        r.block,
        r.community,
        r.resolution,
        r.resolution_days || null,
        r.followup_score || null,
        r.created_at || new Date().toISOString(),
        r.closed_at || null
      );
    }
    return recs.length;
  });

  const count = tx(records);
  logger.info(`Imported ${count} historical tickets`);
  return { imported: count };
}

function listHistoricalTickets(params = {}) {
  const db = getDb();
  const { page = 1, pageSize = 20, keyword, category } = params;
  const where = [];
  const args = [];
  if (keyword) { where.push('content LIKE ?'); args.push(`%${keyword}%`); }
  if (category) { where.push('category = ?'); args.push(category); }
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM historical_tickets ${clause}`).get(...args).c;
  const offset = (page - 1) * pageSize;
  const list = db.prepare(`
    SELECT * FROM historical_tickets ${clause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...args, Number(pageSize), Number(offset));
  return { list, total, page: Number(page), pageSize: Number(pageSize) };
}

module.exports = {
  getTickets,
  getTicketById,
  getReviewQueue,
  reviewTicket,
  closeTicket,
  escalateTicket,
  getDashboardStats,
  importHistoricalTickets,
  listHistoricalTickets,
};
