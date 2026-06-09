const { v4: uuidv4 } = require('uuid');
const models = require('../models');
const config = require('../config');
const OpenAIService = require('./openaiService');
const VectorStoreService = require('./vectorStoreService');
const AuditService = require('./auditService');
const AlertService = require('./alertService');

class RiskDetectionService {
  async detectRisksForContract(contractId, contractVersionId, options = {}) {
    const { userId, ip } = options;

    const contract = await models.Contract.findByPk(contractId, {
      include: [{ model: models.ContractVersion, as: 'versions', where: { id: contractVersionId }, limit: 1 }],
    });

    if (!contract) {
      throw new Error('合同不存在');
    }

    const clauses = await models.Clause.findAll({
      where: { contract_id: contractId, contract_version_id: contractVersionId },
      order: [['start_position', 'ASC']],
    });

    if (clauses.length === 0) {
      await AlertService.checkDataMissing(
        'clause', {}, [], null, contractId
      );
      return { total: 0, risks: [] };
    }

    await AlertService.checkDataMissing(
      'contract',
      contract,
      ['party_a', 'party_b', 'effective_date', 'expiry_date'],
      contract.id,
      contract.id
    );

    const historicalClauses = await this._getHistoricalClauses(clauses);

    const allRisks = [];

    for (const clause of clauses) {
      const clauseRisks = await this._detectRisksForClause(
        clause,
        contract,
        historicalClauses,
        userId,
        ip
      );
      allRisks.push(...clauseRisks);
    }

    const confidenceMetrics = allRisks.map(r => ({ confidence_score: parseFloat(r.confidence_score) }));
    await this._checkModelDrift(confidenceMetrics, contractId);

    await this._addLowConfidenceToReviewQueue(allRisks, userId);

    return {
      total: clauses.length,
      total_risks: allRisks.length,
      risks: allRisks,
      summary: this._summarizeRisks(allRisks),
    };
  }

  async _detectRisksForClause(clause, contract, historicalClauses, userId, ip) {
    const risks = [];
    const riskTypesToCheck = ['payment', 'breach', 'confidentiality', 'auto_renewal'];

    const ContractService = require('./contractService');

    const similar = await VectorStoreService.searchAcrossContracts(
      clause.content,
      {
        topK: 5,
        minSimilarity: 0.75,
        clauseTypes: [clause.clause_type],
      }
    );

    const similarWithContext = similar.map(s => ({
      ...s,
      historical_notes: s.historical_notes || '',
    }));

    const humanReviewContext = await ContractService.getHistoricalContextForClause(
      clause.content, clause.clause_type, 5
    );

    const primaryRiskType = riskTypesToCheck.includes(clause.clause_type)
      ? clause.clause_type
      : this._inferRiskType(clause.content, clause.clause_type);

    if (primaryRiskType) {
      const analysis = await OpenAIService.analyzeRisk(
        clause.content,
        primaryRiskType,
        {
          contract_type: contract.contract_type,
          party_a: contract.party_a,
          party_b: contract.party_b,
          similar_clauses: similarWithContext,
          historical_reviews: humanReviewContext.filter(c => !c.is_history_note),
          historical_notes: humanReviewContext.filter(c => c.is_history_note).map(c => ({
            clause_type: c.clause_type,
            clause_content: c.clause_content,
            historical_notes: c.historical_notes,
          })),
          current_clause_type: clause.clause_type,
          current_clause_title: clause.clause_title,
          current_clause_number: clause.clause_number,
          current_clause_historical_notes: clause.historical_notes || '',
        }
      );

      if (analysis.has_risk && analysis.risk_type) {
        const risk = await this._createRiskAnnotation(
          clause,
          contract,
          analysis,
          similarWithContext,
          userId,
          ip,
          humanReviewContext.length > 0
            ? humanReviewContext.map(h => h.clause_id).filter(Boolean)
            : []
        );
        risks.push(risk);
      }

      if (!riskTypesToCheck.includes(clause.clause_type)) {
        for (const rt of riskTypesToCheck.filter(r => r !== primaryRiskType)) {
          if (this._hasKeywordsForType(clause.content, rt)) {
            const subAnalysis = await OpenAIService.analyzeRisk(
              clause.content, rt,
              {
                contract_type: contract.contract_type,
                similar_clauses: similarWithContext,
                historical_reviews: humanReviewContext.filter(c => !c.is_history_note),
                historical_notes: humanReviewContext.filter(c => c.is_history_note),
                current_clause_historical_notes: clause.historical_notes || '',
              }
            );
            if (subAnalysis.has_risk && subAnalysis.risk_type) {
              const subRisk = await this._createRiskAnnotation(
                clause, contract, subAnalysis, similarWithContext, userId, ip
              );
              risks.push(subRisk);
            }
          }
        }
      }
    }

    return risks;
  }

  async _createRiskAnnotation(clause, contract, analysis, similarClauses, userId, ip, humanReviewClauseIds = []) {
    const confidenceScore = parseFloat(analysis.confidence_score);
    const isLowConfidence = confidenceScore < config.risk.lowConfidenceThreshold;

    let status = 'pending_review';
    if (isLowConfidence) {
      status = 'review_queue';
    } else if (analysis.risk_level === 'critical') {
      status = 'review_queue';
    }

    const evidenceClauseIds = [
      ...similarClauses.map(s => s.clause_id).filter(Boolean),
      ...humanReviewClauseIds,
    ];

    const risk = await models.RiskAnnotation.create({
      id: uuidv4(),
      clause_id: clause.id,
      contract_id: contract.id,
      risk_type: analysis.risk_type,
      risk_level: analysis.risk_level,
      confidence_score: confidenceScore,
      is_low_confidence: isLowConfidence,
      ai_summary: analysis.summary + '\n\n' + (analysis.warning || ''),
      ai_quoted_text: analysis.quoted_text,
      evidence_clause_ids: [...new Set(evidenceClauseIds)],
      source: 'ai',
      status: status,
      review_status: isLowConfidence ? 'not_started' : 'not_started',
      queue_priority: isLowConfidence ? (analysis.risk_level === 'critical' ? 100 : 50) : 0,
      model_version: config.openai.model,
    });

    await AuditService.logRiskCreate(risk, clause, userId, ip);

    return risk;
  }

  async _addLowConfidenceToReviewQueue(risks, userId) {
    const lowConfidenceRisks = risks.filter(r =>
      r.status === 'review_queue'
    );

    for (const risk of lowConfidenceRisks) {
      const existing = await models.ReviewQueue.findOne({
        where: { risk_annotation_id: risk.id },
      });

      if (!existing) {
        const reason = parseFloat(risk.confidence_score) < config.risk.lowConfidenceThreshold
          ? 'low_confidence'
          : 'high_risk';

        await models.ReviewQueue.create({
          id: uuidv4(),
          risk_annotation_id: risk.id,
          contract_id: risk.contract_id,
          clause_id: risk.clause_id,
          queue_reason: reason,
          priority: risk.queue_priority,
          status: 'queued',
          confidence_score: risk.confidence_score,
          original_risk_type: risk.risk_type,
          original_risk_level: risk.risk_level,
          sla_due_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
          created_by: userId,
        });
      }
    }
  }

  async humanOverride(riskId, updateData, userId, ip) {
    const risk = await models.RiskAnnotation.findByPk(riskId);
    if (!risk) {
      throw new Error('风险标注不存在');
    }

    const oldValues = {
      risk_type: risk.risk_type,
      risk_level: risk.risk_level,
      status: risk.status,
      human_notes: risk.human_notes,
    };

    const updates = {};
    const changedFields = [];

    if (updateData.human_risk_type && updateData.human_risk_type !== risk.risk_type) {
      updates.risk_type = updateData.human_risk_type;
      updates.human_risk_type = updateData.human_risk_type;
      changedFields.push('风险类型');
    }

    if (updateData.human_risk_level && updateData.human_risk_level !== risk.risk_level) {
      updates.risk_level = updateData.human_risk_level;
      updates.human_risk_level = updateData.human_risk_level;
      changedFields.push('风险等级');
    }

    if (updateData.human_notes) {
      updates.human_notes = updateData.human_notes;
      changedFields.push('复核备注');
    }

    if (updateData.remove_risk === true) {
      updates.status = 'rejected';
      updates.is_overruled = true;
      changedFields.push('移除风险标注');
    } else if (updateData.approve === true) {
      updates.status = 'approved';
      updates.review_status = 'completed';
      updates.reviewed_by = userId;
      updates.reviewed_at = new Date();
      changedFields.push('通过风险标注');
    } else if (Object.keys(updates).length > 0) {
      updates.status = 'modified';
      updates.reviewed_by = userId;
      updates.reviewed_at = new Date();
      updates.is_overruled = true;
    }

    if (Object.keys(updates).length === 0) {
      return risk;
    }

    updates.source = 'human';

    await risk.update(updates);

    const summary = `人工改标: ${changedFields.join(', ')}`;
    await AuditService.logRiskModify(risk, oldValues, userId, ip, summary);

    if (risk.status === 'approved' || risk.status === 'rejected' || risk.status === 'modified') {
      const queueItem = await models.ReviewQueue.findOne({
        where: { risk_annotation_id: risk.id },
      });
      if (queueItem && queueItem.status !== 'completed') {
        await queueItem.update({
          status: 'completed',
          completed_by: userId,
          completed_at: new Date(),
          review_notes: updateData.human_notes || summary,
        });
        await AuditService.logReviewQueueAction('complete', queueItem, userId, ip, summary);
      }
    }

    return risk;
  }

  async approveAllRisks(contractId, userId, ip) {
    const risks = await models.RiskAnnotation.findAll({
      where: {
        contract_id: contractId,
        status: ['pending_review', 'modified'],
      },
    });

    const results = [];
    for (const risk of risks) {
      try {
        const updated = await this.humanOverride(
          risk.id,
          { approve: true, human_notes: '批量通过' },
          userId,
          ip
        );
        results.push(updated);
      } catch (e) {
        console.error(`Failed to approve risk ${risk.id}:`, e.message);
      }
    }

    return { approved: results.length, total: risks.length };
  }

  async getAllRisksForContract(contractId, filters = {}) {
    const where = { contract_id: contractId };
    if (filters.risk_type) where.risk_type = filters.risk_type;
    if (filters.risk_level) where.risk_level = filters.risk_level;
    if (filters.status) where.status = filters.status;

    return models.RiskAnnotation.findAll({
      where,
      order: [
        ['risk_level', 'DESC'],
        ['confidence_score', 'DESC'],
      ],
      include: [
        {
          model: models.Clause,
          attributes: ['id', 'clause_number', 'clause_title', 'clause_type', 'content'],
        },
        {
          model: models.ReviewQueue,
          as: 'reviewQueueItem',
          include: [
            { model: models.User, as: 'assignee', attributes: ['id', 'full_name'] },
          ],
        },
      ],
    });
  }

  _summarizeRisks(risks) {
    const byType = { payment: 0, breach: 0, confidentiality: 0, auto_renewal: 0 };
    const byLevel = { low: 0, medium: 0, high: 0, critical: 0 };
    let lowConfidenceCount = 0;

    for (const r of risks) {
      const type = typeof r.risk_type === 'string' ? r.risk_type : r.getDataValue('risk_type');
      const level = typeof r.risk_level === 'string' ? r.risk_level : r.getDataValue('risk_level');
      if (byType[type] !== undefined) byType[type]++;
      if (byLevel[level] !== undefined) byLevel[level]++;
      if (r.is_low_confidence || r.getDataValue('is_low_confidence')) lowConfidenceCount++;
    }

    return {
      total_risks: risks.length,
      by_type: byType,
      by_level: byLevel,
      low_confidence_count: lowConfidenceCount,
    };
  }

  async _getHistoricalClauses(clauses) {
    const types = [...new Set(clauses.map(c => c.clause_type))];
    return models.Clause.findAll({
      where: {
        clause_type: types,
      },
      limit: 50,
      order: [['created_at', 'DESC']],
    });
  }

  _inferRiskType(content, clauseType) {
    const typeKeywords = {
      payment: ['付款', '支付', '金额', '费用', '违约金', '逾期', '利息', '账款'],
      breach: ['违约', '赔偿', '责任', '损失', '罚则', '追偿'],
      confidentiality: ['保密', '秘密', '披露', '泄露', '信息', '隐私'],
      auto_renewal: ['自动续', '续约', '延期', '续期', '顺延'],
    };

    let bestType = null;
    let bestCount = 0;

    for (const [type, keywords] of Object.entries(typeKeywords)) {
      const count = keywords.filter(kw => content.includes(kw)).length;
      if (count > bestCount) {
        bestCount = count;
        bestType = type;
      }
    }

    return bestCount >= 2 ? bestType : null;
  }

  _hasKeywordsForType(content, riskType) {
    const keywordMap = {
      payment: ['付款', '支付', '金额', '违约金', '逾期'],
      breach: ['违约', '赔偿', '损失', '责任'],
      confidentiality: ['保密', '秘密', '披露', '泄露'],
      auto_renewal: ['自动续', '续约', '延期', '顺延'],
    };
    const keywords = keywordMap[riskType] || [];
    return keywords.some(kw => content.includes(kw));
  }

  async _checkModelDrift(currentMetrics, contractId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const baseline = await models.RiskAnnotation.findAll({
      attributes: ['confidence_score'],
      where: {
        source: 'ai',
        created_at: {
          [require('sequelize').Op.lt]: thirtyDaysAgo,
        },
      },
      limit: 500,
      order: [['created_at', 'DESC']],
    });

    if (baseline.length >= 100) {
      await AlertService.detectModelDrift(
        currentMetrics,
        baseline.map(b => ({ confidence_score: parseFloat(b.confidence_score) })),
        contractId
      );
    }
  }
}

module.exports = new RiskDetectionService();
