const { v4: uuidv4 } = require('uuid');
const models = require('../models');
const { sequelize } = require('../db/connection');
const AuditService = require('./auditService');
const AlertService = require('./alertService');

class ClauseListService {
  async generateClauseList(contractId, userId, ip, options = {}) {
    const contract = await models.Contract.findByPk(contractId);
    if (!contract) {
      throw new Error('合同不存在');
    }

    if (contract.status !== 'approved') {
      const reviewValidation = await this.validateAllRisksReviewed(contractId);
      const detailParts = [];
      if (contract.status === 'draft') detailParts.push('合同为草稿状态');
      if (contract.status === 'processing') detailParts.push('合同仍在处理中（条款切分/AI风险检测未完成）');
      if (contract.status === 'reviewing') detailParts.push('合同等待复核中');
      if (contract.status === 'rejected') detailParts.push('合同已被拒绝');
      if (contract.status === 'archived') detailParts.push('合同已归档');
      detailParts.push(`当前状态: ${contract.status}`);
      if (reviewValidation.pending > 0) {
        detailParts.push(`仍有 ${reviewValidation.pending} 条风险标注未完成人工复核`);
      }
      if (!contract.reviewer_id) {
        detailParts.push('未记录复核人（reviewer_id为空）');
      }
      throw new Error(
        `根据业务规则，只有复核通过（status='approved'）的合同才能生成条款清单。` +
        `当前问题：${detailParts.join('；')}。` +
        `请先完成合同复核流程。`
      );
    }

    if (!contract.reviewer_id) {
      throw new Error('合同通过状态异常（无reviewer_id），禁止生成清单');
    }

    const activeVersion = await models.ContractVersion.findOne({
      where: { contract_id: contractId, is_active: true },
    });
    if (!activeVersion) {
      throw new Error('合同无有效活跃版本');
    }

    if (!activeVersion.vector_index_version) {
      throw new Error(
        `活跃版本(v${activeVersion.version_number})未绑定向量索引版本(vector_index_version为空)，` +
        `根据业务规则不允许生成条款清单，以保证后续向量检索一致性。` +
        `请重新触发向量化构建或联系系统管理员。`
      );
    }

    const clauseCount = await models.Clause.count({
      where: { contract_version_id: activeVersion.id },
    });
    if (clauseCount === 0) {
      throw new Error(`活跃版本(v${activeVersion.version_number})无条款数据，不可生成清单`);
    }

    const allRisksStatus = await this.validateAllRisksReviewed(contractId);
    if (allRisksStatus.pending > 0) {
      throw new Error(
        `合同已标记approved，但检测到仍有${allRisksStatus.pending}条风险未完成人工复核（状态异常）。` +
        `请修复数据后再生成清单。`
      );
    }

    const clauses = await models.Clause.findAll({
      where: { contract_version_id: activeVersion.id },
      order: [['start_position', 'ASC']],
      include: [
        {
          model: models.RiskAnnotation,
          as: 'riskAnnotations',
          where: { status: ['approved', 'modified'] },
          required: false,
        },
      ],
    });

    const existingLatest = await models.ClauseList.findOne({
      where: { contract_id: contractId },
      order: [['version_number', 'DESC']],
    });
    const nextVersion = existingLatest ? existingLatest.version_number + 1 : 1;

    const clauseItems = clauses.map(clause => {
      const risks = (clause.riskAnnotations || []).map(r => ({
        risk_id: r.id,
        risk_type: r.risk_type,
        risk_level: r.human_risk_level || r.risk_level,
        final_risk_type: r.human_risk_type || r.risk_type,
        confidence: parseFloat(r.confidence_score),
        is_human_modified: r.status === 'modified' || r.is_overruled,
        summary: r.ai_summary,
        human_notes: r.human_notes,
      }));

      return {
        clause_id: clause.id,
        clause_number: clause.clause_number,
        clause_title: clause.clause_title,
        clause_type: clause.clause_type,
        content: clause.content,
        page_number: clause.page_number,
        has_risks: risks.length > 0,
        risks,
        risk_level: this._getHighestRiskLevel(risks),
      };
    });

    const riskSummary = this._calculateRiskSummary(clauseItems);

    const clauseList = await models.ClauseList.create({
      id: uuidv4(),
      contract_id: contractId,
      contract_version_id: activeVersion.id,
      vector_index_version: activeVersion.vector_index_version,
      version_number: nextVersion,
      title: `${contract.title} - 条款清单 v${nextVersion}`,
      status: 'finalized',
      clause_items: clauseItems,
      risk_summary: riskSummary,
      generated_by: userId,
      approved_by: contract.reviewer_id || userId,
      approved_at: new Date(),
      notes: options.notes || '',
      generation_basis: {
        contract_status: contract.status,
        contract_version: activeVersion.version_number,
        vector_index_version: activeVersion.vector_index_version,
        total_risks: allRisksStatus.total,
        risks_pending: allRisksStatus.pending,
        risks_approved: allRisksStatus.approved,
        risks_rejected: allRisksStatus.rejected,
        reviewer_id: contract.reviewer_id,
      },
    });

    await AuditService.logClauseListExport(clauseList, userId, ip);

    return clauseList;
  }

  async getClauseList(clauseListId) {
    const clauseList = await models.ClauseList.findByPk(clauseListId, {
      include: [
        {
          model: models.Contract,
          attributes: ['id', 'title', 'contract_number', 'party_a', 'party_b'],
        },
        {
          model: models.ContractVersion,
          attributes: ['id', 'version_number', 'original_filename'],
        },
        {
          model: models.User,
          as: 'generator',
          attributes: ['id', 'full_name', 'username'],
        },
      ],
    });

    if (!clauseList) return null;

    return clauseList;
  }

  async listClauseLists(contractId, options = {}) {
    const where = {};
    if (contractId) where.contract_id = contractId;
    if (options.status) where.status = options.status;

    return models.ClauseList.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: models.Contract,
          attributes: ['id', 'title', 'contract_number'],
        },
        {
          model: models.User,
          as: 'generator',
          attributes: ['id', 'full_name'],
        },
      ],
      limit: options.limit || 50,
      offset: options.offset || 0,
    });
  }

  async exportClauseList(clauseListId, format = 'json') {
    const clauseList = await this.getClauseList(clauseListId);
    if (!clauseList) {
      throw new Error('条款清单不存在');
    }

    switch (format) {
      case 'json':
        return this._exportJson(clauseList);
      case 'markdown':
        return this._exportMarkdown(clauseList);
      case 'csv':
        return this._exportCsv(clauseList);
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  async validateAllRisksReviewed(contractId) {
    const risks = await models.RiskAnnotation.findAll({
      where: { contract_id: contractId },
      attributes: ['status', 'risk_type', 'risk_level', 'confidence_score'],
    });

    const total = risks.length;
    const pending = risks.filter(r => ['pending_review', 'review_queue'].includes(r.status)).length;
    const approved = risks.filter(r => ['approved', 'modified'].includes(r.status)).length;
    const rejected = risks.filter(r => r.status === 'rejected').length;

    return {
      total,
      pending,
      approved,
      rejected,
      can_generate: pending === 0,
      status: pending === 0 ? 'ready' : 'pending_review',
      summary: {
        by_type: this._countBy(risks, 'risk_type'),
        by_level: this._countBy(risks, 'risk_level'),
      },
    };
  }

  _exportJson(clauseList) {
    return {
      format: 'json',
      content_type: 'application/json',
      filename: `${clauseList.title.replace(/\s+/g, '_')}.json`,
      data: JSON.stringify({
        id: clauseList.id,
        version: clauseList.version_number,
        title: clauseList.title,
        generated_at: clauseList.created_at,
        contract: clauseList.Contract,
        risk_summary: clauseList.risk_summary,
        clauses: clauseList.clause_items,
      }, null, 2),
    };
  }

  _exportMarkdown(clauseList) {
    const lines = [];
    lines.push(`# ${clauseList.title}`);
    lines.push('');
    lines.push(`**生成时间**: ${new Date(clauseList.created_at).toLocaleString('zh-CN')}`);
    lines.push(`**版本号**: v${clauseList.version_number}`);
    lines.push('');

    if (clauseList.Contract) {
      lines.push('## 合同信息');
      lines.push(`- **合同编号**: ${clauseList.Contract.contract_number || '无'}`);
      lines.push(`- **甲方**: ${clauseList.Contract.party_a || '无'}`);
      lines.push(`- **乙方**: ${clauseList.Contract.party_b || '无'}`);
      lines.push('');
    }

    lines.push('## 风险汇总');
    const rs = clauseList.risk_summary || {};
    lines.push(`- **条款总数**: ${rs.total_clauses || 0}`);
    lines.push(`- **含风险条款数**: ${rs.clauses_with_risks || 0}`);
    lines.push(`- **风险总数**: ${rs.total_risks || 0}`);
    lines.push('');
    lines.push('| 风险等级 | 数量 |');
    lines.push('|---------|------|');
    for (const level of ['critical', 'high', 'medium', 'low']) {
      const count = (rs.by_level && rs.by_level[level]) || 0;
      lines.push(`| ${this._levelLabel(level)} | ${count} |`);
    }
    lines.push('');

    lines.push('## 条款清单');
    lines.push('');

    for (const item of (clauseList.clause_items || [])) {
      const prefix = item.clause_number ? `**${item.clause_number}** ` : '';
      lines.push(`### ${prefix}${item.clause_title || '条款'}`);
      lines.push('');
      lines.push(`> 类型: ${this._typeLabel(item.clause_type)} | 最高风险: ${this._levelLabel(item.risk_level)}`);
      lines.push('');
      lines.push(item.content);
      lines.push('');

      if (item.risks && item.risks.length > 0) {
        lines.push('**风险标注:**');
        lines.push('');
        for (const risk of item.risks) {
          lines.push(`- [${this._levelLabel(risk.risk_level)}] ${this._typeLabel(risk.final_risk_type || risk.risk_type)} (置信度: ${(risk.confidence * 100).toFixed(0)}%)`);
          if (risk.is_human_modified) lines.push(`  - ⚠️ 人工调整`);
          if (risk.human_notes) lines.push(`  - 复核备注: ${risk.human_notes}`);
          lines.push(`  - ${risk.summary}`);
          lines.push('');
        }
      }
    }

    lines.push('---');
    lines.push('> ⚠️ **免责声明**: 本清单中的风险提示由AI系统辅助生成，仅供参考，不构成法律意见。请咨询专业法律顾问。');

    return {
      format: 'markdown',
      content_type: 'text/markdown; charset=utf-8',
      filename: `${clauseList.title.replace(/\s+/g, '_')}.md`,
      data: lines.join('\n'),
    };
  }

  _exportCsv(clauseList) {
    const headers = ['条款编号', '条款标题', '条款类型', '内容摘要', '风险等级', '风险类型', '置信度', '人工调整', '复核备注'];
    const rows = [headers.join(',')];

    for (const item of (clauseList.clause_items || [])) {
      const content = (item.content || '').substring(0, 100).replace(/[,\n"]/g, ' ');
      if (item.risks && item.risks.length > 0) {
        for (const risk of item.risks) {
          const notes = (risk.human_notes || '').replace(/[,\n"]/g, ' ');
          rows.push([
            item.clause_number || '',
            `"${(item.clause_title || '').replace(/"/g, '""')}"`,
            this._typeLabel(item.clause_type),
            `"${content}"`,
            this._levelLabel(risk.risk_level),
            this._typeLabel(risk.final_risk_type || risk.risk_type),
            (risk.confidence * 100).toFixed(0) + '%',
            risk.is_human_modified ? '是' : '否',
            `"${notes}"`,
          ].join(','));
        }
      } else {
        rows.push([
          item.clause_number || '',
          `"${(item.clause_title || '').replace(/"/g, '""')}"`,
          this._typeLabel(item.clause_type),
          `"${content}"`,
          '无',
          '',
          '',
          '',
          '',
        ].join(','));
      }
    }

    return {
      format: 'csv',
      content_type: 'text/csv; charset=utf-8',
      filename: `${clauseList.title.replace(/\s+/g, '_')}.csv`,
      data: '\ufeff' + rows.join('\n'),
    };
  }

  _calculateRiskSummary(clauseItems) {
    const totalClauses = clauseItems.length;
    const clausesWithRisks = clauseItems.filter(c => c.has_risks).length;
    const allRisks = clauseItems.flatMap(c => c.risks || []);
    const totalRisks = allRisks.length;

    const byLevel = { low: 0, medium: 0, high: 0, critical: 0 };
    const byType = { payment: 0, breach: 0, confidentiality: 0, auto_renewal: 0, other: 0 };
    const humanModified = allRisks.filter(r => r.is_human_modified).length;

    for (const risk of allRisks) {
      const level = risk.risk_level || 'medium';
      if (byLevel[level] !== undefined) byLevel[level]++;
      const type = risk.final_risk_type || risk.risk_type;
      if (byType[type] !== undefined) {
        byType[type]++;
      } else {
        byType.other++;
      }
    }

    return {
      total_clauses: totalClauses,
      clauses_with_risks: clausesWithRisks,
      total_risks: totalRisks,
      human_modified: humanModified,
      by_level: byLevel,
      by_type: byType,
    };
  }

  _getHighestRiskLevel(risks) {
    if (!risks || risks.length === 0) return null;
    const order = { critical: 4, high: 3, medium: 2, low: 1 };
    return risks.reduce((highest, r) => {
      const l = r.risk_level || 'medium';
      return order[l] > (order[highest] || 0) ? l : highest;
    }, 'low');
  }

  _countBy(arr, field) {
    return arr.reduce((acc, item) => {
      const v = item[field] || 'unknown';
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
  }

  _levelLabel(level) {
    const labels = { critical: '严重', high: '高', medium: '中', low: '低' };
    return labels[level] || level || '无';
  }

  _typeLabel(type) {
    const labels = {
      payment: '付款风险',
      breach: '违约风险',
      confidentiality: '保密风险',
      auto_renewal: '自动续约风险',
      other: '其他',
      definition: '定义条款',
      obligation: '义务条款',
      termination: '终止条款',
      liability: '责任条款',
      ip: '知识产权条款',
      dispute: '争议解决条款',
      force_majeure: '不可抗力条款',
    };
    return labels[type] || type || '未知';
  }
}

module.exports = new ClauseListService();
