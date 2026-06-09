const { v4: uuidv4 } = require('uuid');
const models = require('../models');
const { sequelize } = require('../db/connection');
const AuditService = require('./auditService');
const AlertService = require('./alertService');

class ReviewQueueService {
  async getQueue(options = {}) {
    const {
      status = null,
      assigned_to = null,
      queue_reason = null,
      contract_id = null,
      limit = 50,
      offset = 0,
      orderByPriority = true,
    } = options;

    const where = {};
    if (status) where.status = status;
    if (assigned_to) where.assigned_to = assigned_to;
    if (queue_reason) where.queue_reason = queue_reason;
    if (contract_id) where.contract_id = contract_id;

    const order = [];
    if (orderByPriority) order.push(['priority', 'DESC']);
    order.push(['sla_due_at', 'ASC']);
    order.push(['created_at', 'ASC']);

    return models.ReviewQueue.findAndCountAll({
      where,
      order,
      limit,
      offset,
      include: [
        {
          model: models.RiskAnnotation,
          include: [
            {
              model: models.Clause,
              attributes: ['id', 'clause_number', 'clause_title', 'clause_type', 'content'],
            },
          ],
        },
        {
          model: models.Contract,
          attributes: ['id', 'title', 'contract_number', 'contract_type'],
        },
        {
          model: models.User,
          as: 'assignee',
          attributes: ['id', 'full_name', 'username', 'email'],
        },
      ],
    });
  }

  async assignToMe(queueId, userId, ip) {
    const item = await models.ReviewQueue.findByPk(queueId);
    if (!item) {
      throw new Error('复核项不存在');
    }

    if (item.status === 'completed') {
      throw new Error('该复核项已完成');
    }

    await item.update({
      assigned_to: userId,
      status: 'in_progress',
      assigned_at: new Date(),
    });

    await item.reload({
      include: [
        { model: models.RiskAnnotation },
        { model: models.Clause },
      ],
    });

    await AuditService.logReviewQueueAction('start', item, userId, ip, '领取复核任务');

    const risk = await models.RiskAnnotation.findByPk(item.risk_annotation_id);
    if (risk) {
      await risk.update({ review_status: 'in_progress' });
    }

    return item;
  }

  async completeReview(queueId, userId, ip, result) {
    const item = await models.ReviewQueue.findByPk(queueId);
    if (!item) {
      throw new Error('复核项不存在');
    }

    if (item.assigned_to && item.assigned_to !== userId) {
      throw new Error('该复核项已分配给其他人员');
    }

    const transaction = await sequelize.transaction();

    try {
      const risk = await models.RiskAnnotation.findByPk(item.risk_annotation_id, {
        transaction,
      });

      if (!risk) {
        throw new Error('关联的风险标注不存在');
      }

      const oldValues = {
        risk_type: risk.risk_type,
        risk_level: risk.risk_level,
        status: risk.status,
        human_notes: risk.human_notes,
      };

      const updates = {
        reviewed_by: userId,
        reviewed_at: new Date(),
        review_status: 'completed',
        source: 'hybrid',
      };

      let summary = '';

      switch (result.action) {
        case 'approve':
          updates.status = 'approved';
          summary = '二审通过，维持AI判定';
          break;
        case 'reject':
          updates.status = 'rejected';
          updates.is_overruled = true;
          summary = `二审拒绝: ${result.reason || 'AI判定不成立'}`;
          break;
        case 'modify':
          updates.status = 'modified';
          updates.is_overruled = true;
          if (result.risk_type) {
            updates.risk_type = result.risk_type;
            updates.human_risk_type = result.risk_type;
          }
          if (result.risk_level) {
            updates.risk_level = result.risk_level;
            updates.human_risk_level = result.risk_level;
          }
          summary = `二审修改: 风险类型/等级已调整`;
          break;
        case 'escalate':
          item.escalation_count = (item.escalation_count || 0) + 1;
          item.priority = (item.priority || 0) + 50;
          summary = `升级复核: ${result.reason || '需要更高权限人员复核'}`;
          break;
        default:
          throw new Error('未知的复核操作');
      }

      if (result.notes) {
        updates.human_notes = result.notes;
      }

      await risk.update(updates, { transaction });

      if (result.action !== 'escalate') {
        await item.update(
          {
            status: 'completed',
            completed_by: userId,
            completed_at: new Date(),
            review_notes: result.notes || summary,
          },
          { transaction }
        );
      } else {
        await item.update(
          {
            status: 'escalated',
            priority: item.priority,
            escalation_count: item.escalation_count,
          },
          { transaction }
        );
      }

      await transaction.commit();

      await AuditService.logRiskModify(risk, oldValues, userId, ip, summary);
      await AuditService.logReviewQueueAction(result.action === 'escalate' ? 'escalate' : 'complete', item, userId, ip, summary);

      return { risk, queue_item: item };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getReviewerStats(userId) {
    const assigned = await models.ReviewQueue.count({
      where: { assigned_to: userId },
    });

    const inProgress = await models.ReviewQueue.count({
      where: { assigned_to: userId, status: 'in_progress' },
    });

    const completed = await models.ReviewQueue.count({
      where: { assigned_to: userId, status: 'completed' },
    });

    const pending = await models.ReviewQueue.count({
      where: { status: ['queued', 'escalated'] },
    });

    const overdue = await models.ReviewQueue.count({
      where: {
        status: ['queued', 'assigned', 'in_progress', 'escalated'],
        sla_due_at: { [require('sequelize').Op.lt]: new Date() },
      },
    });

    return {
      assigned,
      in_progress: inProgress,
      completed,
      total_pending: pending,
      overdue,
    };
  }

  async getSlaOverdueItems(userId) {
    const where = {
      status: ['queued', 'in_progress', 'escalated'],
      sla_due_at: { [require('sequelize').Op.lt]: new Date() },
    };
    if (userId) where.assigned_to = userId;

    const items = await models.ReviewQueue.findAll({
      where,
      order: [['sla_due_at', 'ASC']],
      include: [
        { model: models.Contract, attributes: ['id', 'title'] },
        { model: models.RiskAnnotation, include: [models.Clause] },
      ],
    });

    if (items.length > 0) {
      await AlertService.create({
        alert_type: 'system_warning',
        severity: 'warning',
        title: `${items.length} 条二审复核任务已超过SLA期限`,
        message: `请及时处理逾期的复核任务`,
        metadata: { overdue_count: items.length },
      });
    }

    return items;
  }

  async addToQueue(riskAnnotationId, contractId, clauseId, reason, priority, userId, options = {}) {
    const risk = await models.RiskAnnotation.findByPk(riskAnnotationId);
    if (!risk) {
      throw new Error('风险标注不存在');
    }

    const existing = await models.ReviewQueue.findOne({
      where: { risk_annotation_id: riskAnnotationId, status: ['queued', 'assigned', 'in_progress', 'escalated'] },
    });

    if (existing) {
      return existing;
    }

    const item = await models.ReviewQueue.create({
      id: uuidv4(),
      risk_annotation_id: riskAnnotationId,
      contract_id: contractId,
      clause_id: clauseId,
      queue_reason: reason,
      priority: priority || 50,
      status: options.assignedTo ? 'assigned' : 'queued',
      assigned_to: options.assignedTo || null,
      assigned_at: options.assignedTo ? new Date() : null,
      confidence_score: risk.confidence_score,
      original_risk_type: risk.risk_type,
      original_risk_level: risk.risk_level,
      sla_due_at: new Date(Date.now() + (options.slaHours || 48) * 60 * 60 * 1000),
      created_by: userId,
    });

    await risk.update({ status: 'review_queue', review_status: 'not_started' });

    await AuditService.logReviewQueueAction('escalate', item, userId, options.ip || '', `人工加入二审队列: ${reason}`);

    return item;
  }

  async getDashboardSummary() {
    const [total, byStatus, byReason, byWeek] = await Promise.all([
      models.ReviewQueue.count(),
      models.ReviewQueue.findAll({
        attributes: ['status', [sequelize.fn('COUNT', '*'), 'count']],
        group: ['status'],
      }),
      models.ReviewQueue.findAll({
        attributes: ['queue_reason', [sequelize.fn('COUNT', '*'), 'count']],
        group: ['queue_reason'],
      }),
      models.ReviewQueue.findAll({
        attributes: [
          [sequelize.fn('date_trunc', 'week', sequelize.col('created_at')), 'week'],
          [sequelize.fn('COUNT', '*'), 'created'],
          [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")), 'completed'],
        ],
        where: {
          created_at: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000),
          },
        },
        group: ['week'],
        order: [['week', 'ASC']],
      }),
    ]);

    return {
      total,
      by_status: byStatus.map(r => ({ status: r.status, count: parseInt(r.dataValues.count) })),
      by_reason: byReason.map(r => ({ reason: r.queue_reason, count: parseInt(r.dataValues.count) })),
      by_week: byWeek.map(r => ({
        week: r.dataValues.week,
        created: parseInt(r.dataValues.created),
        completed: parseInt(r.dataValues.completed),
      })),
    };
  }
}

module.exports = new ReviewQueueService();
