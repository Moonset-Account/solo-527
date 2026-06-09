const { v4: uuidv4 } = require('uuid');
const models = require('../models');
const { sequelize } = require('../db/connection');

class AuditService {
  async log(action, entityType, data = {}, options = {}) {
    try {
      const logEntry = await models.AuditLog.create({
        id: uuidv4(),
        action: action,
        entity_type: entityType,
        entity_id: data.entity_id || null,
        contract_id: data.contract_id || null,
        user_id: data.user_id || options.userId || null,
        ip_address: options.ip || null,
        user_agent: options.userAgent || null,
        old_values: data.oldValues || null,
        new_values: data.newValues || null,
        change_summary: data.changeSummary || null,
        request_id: options.requestId || null,
      });
      return logEntry;
    } catch (error) {
      console.error('Failed to write audit log:', error);
      return null;
    }
  }

  async logContractUpload(contract, userId, ip, userAgent) {
    return this.log('contract_upload', 'contract', {
      entity_id: contract.id,
      contract_id: contract.id,
      newValues: {
        title: contract.title,
        contract_number: contract.contract_number,
        contract_type: contract.contract_type,
        current_version: contract.current_version,
      },
      changeSummary: `上传合同: ${contract.title}`,
      user_id: userId,
    }, { userId, ip, userAgent });
  }

  async logRiskCreate(riskAnnotation, clause, userId, ip) {
    return this.log('risk_create', 'risk_annotation', {
      entity_id: riskAnnotation.id,
      contract_id: riskAnnotation.contract_id,
      newValues: {
        risk_type: riskAnnotation.risk_type,
        risk_level: riskAnnotation.risk_level,
        confidence_score: parseFloat(riskAnnotation.confidence_score),
        clause_id: riskAnnotation.clause_id,
        source: riskAnnotation.source,
      },
      changeSummary: `检测到${riskAnnotation.risk_type}风险 (${riskAnnotation.risk_level}) - 条款: ${clause?.clause_number || clause?.id}`,
      user_id: userId,
    }, { userId, ip });
  }

  async logRiskModify(riskAnnotation, oldValues, userId, ip, changeSummary) {
    return this.log('risk_modify', 'risk_annotation', {
      entity_id: riskAnnotation.id,
      contract_id: riskAnnotation.contract_id,
      oldValues: oldValues,
      newValues: {
        risk_type: riskAnnotation.risk_type,
        risk_level: riskAnnotation.risk_level,
        human_notes: riskAnnotation.human_notes,
        is_overruled: riskAnnotation.is_overruled,
        status: riskAnnotation.status,
      },
      changeSummary: changeSummary || `人工修改了风险标注`,
      user_id: userId,
    }, { userId, ip });
  }

  async logRiskApprove(riskAnnotation, userId, ip) {
    return this.log('risk_approve', 'risk_annotation', {
      entity_id: riskAnnotation.id,
      contract_id: riskAnnotation.contract_id,
      newValues: {
        status: 'approved',
        reviewed_by: userId,
      },
      changeSummary: `复核通过风险标注`,
      user_id: userId,
    }, { userId, ip });
  }

  async logRiskReject(riskAnnotation, userId, ip, reason) {
    return this.log('risk_reject', 'risk_annotation', {
      entity_id: riskAnnotation.id,
      contract_id: riskAnnotation.contract_id,
      newValues: {
        status: 'rejected',
        reviewed_by: userId,
        human_notes: reason,
      },
      changeSummary: `拒绝风险标注: ${reason || ''}`,
      user_id: userId,
    }, { userId, ip });
  }

  async logContractRollback(contractId, rollbackFromVersion, rollbackToVersion, userId, ip) {
    return this.log('contract_rollback', 'contract_version', {
      entity_id: contractId,
      contract_id: contractId,
      oldValues: { version: rollbackFromVersion },
      newValues: { version: rollbackToVersion },
      changeSummary: `合同回滚: 从版本 ${rollbackFromVersion} 回滚到版本 ${rollbackToVersion}`,
      user_id: userId,
    }, { userId, ip });
  }

  async logClauseListExport(clauseList, userId, ip) {
    return this.log('export_clause_list', 'contract', {
      entity_id: clauseList.id,
      contract_id: clauseList.contract_id,
      newValues: {
        clause_list_id: clauseList.id,
        version_number: clauseList.version_number,
        export_format: clauseList.export_format,
      },
      changeSummary: `导出条款清单 v${clauseList.version_number}`,
      user_id: userId,
    }, { userId, ip });
  }

  async logReviewQueueAction(action, reviewQueue, userId, ip, notes) {
    const actions = {
      start: 'review_start',
      complete: 'review_complete',
      escalate: 'risk_to_review_queue',
    };
    return this.log(actions[action] || 'other', 'review_queue', {
      entity_id: reviewQueue.id,
      contract_id: reviewQueue.contract_id,
      newValues: {
        status: reviewQueue.status,
        assigned_to: reviewQueue.assigned_to,
        priority: reviewQueue.priority,
      },
      changeSummary: notes || `二审队列${action}操作`,
      user_id: userId,
    }, { userId, ip });
  }

  async query(options = {}) {
    const {
      userId,
      action,
      entityType,
      entityId,
      contractId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
    } = options;

    const where = {};
    if (userId) where.user_id = userId;
    if (action) where.action = action;
    if (entityType) where.entity_type = entityType;
    if (entityId) where.entity_id = entityId;
    if (contractId) where.contract_id = contractId;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at['$gte'] = new Date(startDate);
      if (endDate) where.created_at['$lte'] = new Date(endDate);
    }

    return models.AuditLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      include: [
        { model: models.User, attributes: ['id', 'full_name', 'username', 'role'] },
      ],
    });
  }

  async getContractHistory(contractId) {
    return this.query({
      contractId,
      entityType: null,
    });
  }
}

module.exports = new AuditService();
