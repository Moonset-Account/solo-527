const OpenAI = require('openai');
const config = require('../config');
const AlertService = require('./alertService');

class OpenAIService {
  constructor() {
    if (!config.openai.apiKey || config.openai.apiKey === 'your-openai-api-key-here') {
      console.warn('WARNING: OpenAI API key not configured. Using mock mode for development.');
      this.mockMode = true;
    } else {
      this.client = new OpenAI({
        apiKey: config.openai.apiKey,
        timeout: config.openai.timeout,
        maxRetries: config.openai.maxRetries,
      });
      this.mockMode = false;
    }
  }

  async createEmbedding(text) {
    if (this.mockMode) {
      return this._mockEmbedding(text);
    }

    try {
      const response = await this.client.embeddings.create({
        model: config.openai.embeddingModel,
        input: text.substring(0, 8000),
        encoding_format: 'float',
      });
      return response.data[0].embedding;
    } catch (error) {
      await AlertService.create({
        alert_type: 'service_failure',
        severity: 'error',
        title: 'OpenAI Embedding API 调用失败',
        message: error.message,
        service_name: 'openai_embedding',
        error_code: error.code || 'UNKNOWN',
        error_stack: error.stack,
      });
      throw error;
    }
  }

  async createEmbeddings(texts) {
    if (this.mockMode) {
      return Promise.all(texts.map(t => this._mockEmbedding(t)));
    }

    try {
      const truncatedTexts = texts.map(t => t.substring(0, 8000));
      const response = await this.client.embeddings.create({
        model: config.openai.embeddingModel,
        input: truncatedTexts,
        encoding_format: 'float',
      });
      return response.data.map(item => item.embedding);
    } catch (error) {
      await AlertService.create({
        alert_type: 'service_failure',
        severity: 'error',
        title: 'OpenAI Batch Embedding API 调用失败',
        message: error.message,
        service_name: 'openai_embedding_batch',
        error_code: error.code || 'UNKNOWN',
        metadata: { batch_size: texts.length },
      });
      throw error;
    }
  }

  async analyzeRisk(clauseText, clauseType, context = {}) {
    const prompt = this._buildRiskPrompt(clauseText, clauseType, context);

    if (this.mockMode) {
      return this._mockRiskAnalysis(clauseText, clauseType, context);
    }

    try {
      const response = await this.client.chat.completions.create({
        model: config.openai.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `你是一个合同条款风险分析助手。你的任务是提示合同条款中可能存在的风险，并引用原文作为证据。
重要提示：
1. 你只能提示风险和引用原文，不能提供法律意见
2. 你必须明确标注风险类型（payment/breach/confidentiality/auto_renewal）
3. 你必须给出置信度分数（0-1之间）
4. 你必须引用原文中最相关的片段
5. 对于不明确的情况，给出较低的置信度并说明原因
6. 以JSON格式返回结果`,
          },
          { role: 'user', content: prompt },
        ],
      });

      const content = response.choices[0].message.content;
      let result;
      try {
        result = JSON.parse(content);
      } catch (parseError) {
        throw new Error(`Failed to parse OpenAI response: ${content}`);
      }

      return this._normalizeRiskResult(result, clauseText);
    } catch (error) {
      await AlertService.create({
        alert_type: 'service_failure',
        severity: clauseType === 'payment' || clauseType === 'breach' ? 'critical' : 'error',
        title: 'OpenAI Risk Analysis API 调用失败',
        message: error.message,
        service_name: 'openai_risk_analysis',
        error_code: error.code || 'UNKNOWN',
        metadata: { clause_type: clauseType },
      });
      throw error;
    }
  }

  async batchAnalyzeRisks(clauses) {
    if (this.mockMode) {
      return Promise.all(clauses.map(c => this._mockRiskAnalysis(c.content, c.clause_type, c)));
    }

    const results = [];
    const batchSize = 3;

    for (let i = 0; i < clauses.length; i += batchSize) {
      const batch = clauses.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(c => this.analyzeRisk(c.content, c.clause_type))
      );
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            has_risk: false,
            risk_type: null,
            risk_level: null,
            confidence_score: 0,
            summary: '风险分析失败，建议人工复核',
            quoted_text: '',
            error: result.reason.message,
          });
        }
      }
    }

    return results;
  }

  async searchSimilarClauses(queryClause, historicalClauses, topK = 5) {
    if (this.mockMode) {
      return historicalClauses.slice(0, topK).map(c => ({
        clause_id: c.id,
        content: c.content,
        similarity: Math.random() * 0.3 + 0.7,
        historical_notes: c.historical_notes || '',
      }));
    }

    try {
      const queryEmbedding = await this.createEmbedding(queryClause.content);
      const similarityScores = [];

      for (const hc of historicalClauses) {
        if (hc.embedding_vector) {
          const sim = this._cosineSimilarity(queryEmbedding, hc.embedding_vector);
          similarityScores.push({
            clause_id: hc.id,
            content: hc.content,
            similarity: sim,
            historical_notes: hc.historical_notes || '',
          });
        }
      }

      return similarityScores
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
    } catch (error) {
      console.error('Similarity search failed:', error);
      return [];
    }
  }

  _buildRiskPrompt(clauseText, clauseType, context) {
    const similarClauses = context.similar_clauses || [];
    const historicalReviews = context.historical_reviews || [];
    const historicalNotes = context.historical_notes || [];
    const currentHistoricalNotes = context.current_clause_historical_notes || '';

    const formatReview = (r) => {
      const lines = [];
      if (r.clause_number) lines.push(`  条款编号: ${r.clause_number}`);
      if (r.clause_type) lines.push(`  条款类型: ${r.clause_type}`);
      if (r.final_risk_type) lines.push(`  最终风险类型: ${r.final_risk_type}`);
      if (r.final_risk_level) lines.push(`  最终风险等级: ${r.final_risk_level}`);
      if (r.review_result) lines.push(`  复核结果: ${r.review_result}${r.is_overruled ? '（推翻AI原判断）' : ''}`);
      if (r.human_notes) lines.push(`  复核人备注: ${r.human_notes.substring(0, 200)}`);
      if (r.clause_content) lines.push(`  条款摘要: ${r.clause_content.substring(0, 150)}`);
      return lines.join('\n');
    };

    const formatNote = (n) => {
      const lines = [];
      if (n.clause_type) lines.push(`  条款类型: ${n.clause_type}`);
      if (n.historical_notes) lines.push(`  历史修改意见: ${n.historical_notes.substring(0, 300)}`);
      if (n.clause_content) lines.push(`  条款摘要: ${n.clause_content.substring(0, 150)}`);
      return lines.join('\n');
    };

    return `请分析以下合同条款的风险（重点参考历史人工复核结果和历史修改意见）：

【当前条款信息】
条款编号: ${context.current_clause_number || '未知'}
条款标题: ${context.current_clause_title || '未知'}
条款类型: ${clauseType}
当前条款历史修改意见: ${currentHistoricalNotes || '（无）'}
条款原文:
${clauseText}

【合同上下文】
- 合同类型: ${context.contract_type || '未知'}
- 甲方: ${context.party_a || '未知'}
- 乙方: ${context.party_b || '未知'}

【参考：历史相似条款语义检索（Top ${similarClauses.length}）】
${similarClauses.length === 0 ? '（无相似条款）' : similarClauses.map((sc, i) => {
  return `#${i + 1} 相似度${sc.similarity?.toFixed(2) || 'N/A'} | 类型:${sc.clause_type || 'N/A'}\n  内容摘要: ${(sc.content || '').substring(0, 150)}\n  备注: ${sc.historical_notes || '（无修改意见）'}`;
}).join('\n\n')}

【参考：历史人工复核结果（已过审或已改标，共 ${historicalReviews.length} 条）】
请重点参考历史复核人的判断逻辑，尤其是被推翻的AI判断（is_overruled = true）：
${historicalReviews.length === 0 ? '（暂无历史复核数据）' : historicalReviews.map((r, i) => `--- 历史复核 #${i + 1} ---\n${formatReview(r)}`).join('\n\n')}

【参考：同类条款的历史修改意见备注（共 ${historicalNotes.length} 条）】
${historicalNotes.length === 0 ? '（暂无历史修改意见）' : historicalNotes.map((n, i) => `--- 修改意见 #${i + 1} ---\n${formatNote(n)}`).join('\n\n')}

【分析原则】
1. 如果当前条款存在历史修改意见（${currentHistoricalNotes ? '有' : '无'}），请重点结合该意见分析风险趋势。
2. 如果历史人工复核多次推翻同类条款的AI原判断（is_overruled=true），请显著降低对相似模式的置信度。
3. 严格区分AI提示风险 vs 替代法律意见：仅识别风险信号，不给出"应如何修改"的专业法律咨询。
4. 如果历史复核显示同类条款通常被标注为某种风险类型，请在同等文本条件下优先匹配该类型。

请严格以JSON格式返回：
{
  "has_risk": boolean,
  "risk_type": "payment" | "breach" | "confidentiality" | "auto_renewal" | null,
  "risk_level": "low" | "medium" | "high" | "critical" | null,
  "confidence_score": number (0-1),
  "summary": "风险提示说明（仅提示风险，不提供法律意见。若引用了历史数据，请明确说明参考了哪类历史数据）",
  "quoted_text": "引用的原文片段",
  "risk_indicators": ["风险点1", "风险点2"],
  "historical_reference_applied": "none" | "historical_reviews" | "historical_notes" | "both"
}`;
  }

  _normalizeRiskResult(result, originalText) {
    const riskTypes = ['payment', 'breach', 'confidentiality', 'auto_renewal'];
    const riskLevels = ['low', 'medium', 'high', 'critical'];
    const validHistoricalApplied = ['none', 'historical_reviews', 'historical_notes', 'both', 'imported_manual'];
    const rawApplied = result.historical_reference_applied;

    return {
      has_risk: result.has_risk === true,
      risk_type: riskTypes.includes(result.risk_type) ? result.risk_type : null,
      risk_level: riskLevels.includes(result.risk_level) ? result.risk_level : (result.has_risk ? 'medium' : null),
      confidence_score: Math.min(1, Math.max(0, parseFloat(result.confidence_score) || 0)),
      summary: result.summary || '',
      quoted_text: result.quoted_text || originalText.substring(0, 200),
      risk_indicators: Array.isArray(result.risk_indicators) ? result.risk_indicators : [],
      historical_reference_applied: validHistoricalApplied.includes(rawApplied) ? rawApplied : 'none',
      warning: '以上分析由AI模型提供，仅供参考，不构成法律意见。请咨询专业法律顾问。',
    };
  }

  _mockEmbedding(text) {
    const seed = this._hashString(text);
    const dim = config.vector.dimension;
    const vector = new Array(dim);
    for (let i = 0; i < dim; i++) {
      vector[i] = Math.sin(seed + i * 0.01) * 0.5;
    }
    const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    return vector.map(v => v / norm);
  }

  _mockRiskAnalysis(clauseText, clauseType, context = {}) {
    const hasPaymentRisk = clauseText.includes('付款') && (clauseText.includes('逾期') || clauseText.includes('违约金'));
    const hasBreachRisk = clauseText.includes('违约') && clauseText.includes('赔偿');
    const hasConfRisk = clauseText.includes('保密') && !clauseText.includes('期限');
    const hasRenewalRisk = clauseText.includes('自动续') && !clauseText.includes('书面通知');

    const historicalReviews = Array.isArray(context.historical_reviews) ? context.historical_reviews : [];
    const historicalNotes = Array.isArray(context.historical_notes) ? context.historical_notes : [];
    const currentHistoricalNotes = context.current_clause_historical_notes || '';
    const similarClauses = Array.isArray(context.similar_clauses) ? context.similar_clauses : [];

    const hasHistoricalNotesContext = historicalNotes.length > 0 || !!currentHistoricalNotes;
    const hasHistoricalReviewContext = historicalReviews.length > 0;

    let historicalReferenceApplied = 'none';
    if (hasHistoricalReviewContext && hasHistoricalNotesContext) historicalReferenceApplied = 'both';
    else if (hasHistoricalReviewContext) historicalReferenceApplied = 'historical_reviews';
    else if (hasHistoricalNotesContext) historicalReferenceApplied = 'historical_notes';

    const overruledRiskTypes = historicalReviews
      .filter(r => r.is_overruled)
      .map(r => r.final_risk_type)
      .filter(Boolean);

    const preferredRiskTypes = historicalReviews
      .filter(r => r.review_result === 'approved' || r.review_result === 'modified')
      .map(r => r.final_risk_type)
      .filter(Boolean);

    const criticalReviews = historicalReviews.filter(r => r.final_risk_level === 'critical' || r.final_risk_level === 'high');
    const hasCriticalHistory = criticalReviews.length > 0;

    const hasHistoricalNotesForType =
      hasHistoricalNotesContext &&
      (currentHistoricalNotes + JSON.stringify(historicalNotes)).includes(clauseType);

    let hasRisk = false;
    let riskType = clauseType;
    let riskLevel = 'medium';
    let confidence = 0.6;
    let summary = '';
    let quotedText = clauseText.substring(0, 100);
    const riskIndicators = [];

    if (['payment', 'breach', 'confidentiality', 'auto_renewal'].includes(clauseType)) {
      riskType = clauseType;
      if (clauseType === 'payment' && (hasPaymentRisk || hasHistoricalNotesForType)) {
        hasRisk = true;
        riskLevel = hasCriticalHistory || clauseText.includes('高额') || clauseText.includes('全额')
          ? 'high'
          : (hasHistoricalNotesForType ? 'high' : 'medium');
        confidence = hasPaymentRisk ? 0.85 : (hasHistoricalNotesForType ? 0.78 : 0.55);
        summary = '该付款条款存在潜在风险：可能包含不利的逾期付款条件或过高的违约金比例。';
        riskIndicators.push('付款条款风险');
        if (hasHistoricalReviewContext) {
          summary += ` 参考了 ${historicalReviews.length} 条历史复核${overruledRiskTypes.includes('payment') ? '（含被推翻的误判案例）' : ''}。`;
          riskIndicators.push('参考历史复核结果');
        }
        if (currentHistoricalNotes) {
          summary += ` 附当前条款历史修改意见：${currentHistoricalNotes.substring(0, 50)}。`;
          riskIndicators.push('含历史修改意见');
        }
      } else if (clauseType === 'breach' && (hasBreachRisk || hasHistoricalNotesForType)) {
        hasRisk = true;
        riskLevel = hasCriticalHistory || clauseText.includes('全部损失') || clauseText.includes('间接损失')
          ? 'high'
          : (hasHistoricalNotesForType ? 'high' : 'medium');
        confidence = hasBreachRisk ? 0.82 : (hasHistoricalNotesForType ? 0.75 : 0.5);
        summary = '该违约条款存在潜在风险：赔偿范围可能过大，建议核查是否包含间接损失赔偿。';
        riskIndicators.push('违约条款风险');
        if (hasHistoricalReviewContext) {
          summary += ` 参考了 ${historicalReviews.length} 条历史复核。`;
          riskIndicators.push('参考历史复核结果');
        }
        if (currentHistoricalNotes) {
          summary += ` 附当前条款历史修改意见：${currentHistoricalNotes.substring(0, 50)}。`;
          riskIndicators.push('含历史修改意见');
        }
      } else if (clauseType === 'confidentiality' && (hasConfRisk || clauseText.length > 0)) {
        hasRisk = hasConfRisk || hasHistoricalNotesForType;
        riskLevel = (!clauseText.includes('期限') || hasCriticalHistory) ? 'high' : 'medium';
        confidence = hasConfRisk ? 0.88 : (hasHistoricalNotesForType ? 0.8 : 0.65);
        summary = !clauseText.includes('期限')
          ? '该保密条款未约定保密期限，可能导致无限期保密义务，存在重大风险。'
          : '该保密条款约定基本合规，建议核查保密范围和例外条款。';
        riskIndicators.push('保密条款风险');
        if (hasHistoricalReviewContext) {
          summary += ` 参考了 ${historicalReviews.length} 条历史复核${overruledRiskTypes.includes('confidentiality') ? '（同类AI判断曾被推翻）' : ''}。`;
          riskIndicators.push('参考历史复核结果');
        }
        if (currentHistoricalNotes) {
          summary += ` 历史意见摘要：${currentHistoricalNotes.substring(0, 50)}。`;
          riskIndicators.push('含历史修改意见');
        }
      } else if (clauseType === 'auto_renewal') {
        hasRisk = true;
        riskLevel = (hasRenewalRisk || hasCriticalHistory) ? 'high' : 'medium';
        confidence = hasRenewalRisk ? 0.9 : (hasHistoricalNotesForType ? 0.82 : 0.7);
        summary = hasRenewalRisk
          ? '该自动续约条款存在重大风险：未约定提前书面通知终止的机制，可能导致被动续约。'
          : '该自动续约条款存在风险，建议评估续约周期和通知期限是否合理。';
        riskIndicators.push('自动续约条款风险');
        if (hasHistoricalReviewContext) {
          summary += ` 参考了 ${historicalReviews.length} 条历史同类复核。`;
          riskIndicators.push('参考历史复核结果');
        }
      }
    }

    if (!hasRisk && (preferredRiskTypes.length > 0 || hasHistoricalNotesForType)) {
      const preferred = preferredRiskTypes.find(rt =>
        clauseText.includes({
          payment: '付款', breach: '违约',
          confidentiality: '保密', auto_renewal: '自动续',
        }[rt] || '')
      );
      if (preferred) {
        hasRisk = true;
        riskType = preferred;
        riskLevel = 'medium';
        confidence = 0.72;
        summary = `参考历史复核的标注偏好，检测到${preferred}类风险信号，建议人工进一步核查。`;
        riskIndicators.push('历史复核偏好匹配');
      }
    }

    if (hasRisk && similarClauses.length > 0 && similarClauses.some(s => s.has_historical_notes)) {
      riskIndicators.push('相似条款含历史意见');
    }

    return {
      has_risk: hasRisk,
      risk_type: hasRisk ? riskType : null,
      risk_level: hasRisk ? riskLevel : null,
      confidence_score: confidence,
      summary: hasRisk ? summary : '该条款未检测到明显风险，建议结合上下文进行综合判断。',
      quoted_text: quotedText,
      risk_indicators: riskIndicators,
      historical_reference_applied: historicalReferenceApplied,
      warning: '以上分析由AI模型提供（当前为模拟模式），仅供参考，不构成法律意见。请咨询专业法律顾问。',
    };
  }

  _cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 10000;
  }
}

module.exports = new OpenAIService();
