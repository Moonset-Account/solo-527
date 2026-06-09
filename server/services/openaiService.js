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
      return this._mockRiskAnalysis(clauseText, clauseType);
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
      return Promise.all(clauses.map(c => this._mockRiskAnalysis(c.content, c.clause_type)));
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
    return `请分析以下合同条款的风险：

条款类型: ${clauseType}
条款原文:
${clauseText}

上下文信息:
- 合同类型: ${context.contract_type || '未知'}
- 甲方: ${context.party_a || '未知'}
- 乙方: ${context.party_b || '未知'}
- 历史相似条款数: ${(context.similar_clauses || []).length}

历史修改意见参考:
${(context.similar_clauses || []).map(sc => `[相似度${sc.similarity.toFixed(2)}] ${sc.historical_notes || '无备注'}`).join('\n') || '无历史参考'}

请严格以JSON格式返回：
{
  "has_risk": boolean,
  "risk_type": "payment" | "breach" | "confidentiality" | "auto_renewal" | null,
  "risk_level": "low" | "medium" | "high" | "critical" | null,
  "confidence_score": number (0-1),
  "summary": "风险提示说明（仅提示风险，不提供法律意见）",
  "quoted_text": "引用的原文片段",
  "risk_indicators": ["风险点1", "风险点2"]
}`;
  }

  _normalizeRiskResult(result, originalText) {
    const riskTypes = ['payment', 'breach', 'confidentiality', 'auto_renewal'];
    const riskLevels = ['low', 'medium', 'high', 'critical'];

    return {
      has_risk: result.has_risk === true,
      risk_type: riskTypes.includes(result.risk_type) ? result.risk_type : null,
      risk_level: riskLevels.includes(result.risk_level) ? result.risk_level : (result.has_risk ? 'medium' : null),
      confidence_score: Math.min(1, Math.max(0, parseFloat(result.confidence_score) || 0)),
      summary: result.summary || '',
      quoted_text: result.quoted_text || originalText.substring(0, 200),
      risk_indicators: Array.isArray(result.risk_indicators) ? result.risk_indicators : [],
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

  _mockRiskAnalysis(clauseText, clauseType) {
    const hasPaymentRisk = clauseText.includes('付款') && (clauseText.includes('逾期') || clauseText.includes('违约金'));
    const hasBreachRisk = clauseText.includes('违约') && clauseText.includes('赔偿');
    const hasConfRisk = clauseText.includes('保密') && !clauseText.includes('期限');
    const hasRenewalRisk = clauseText.includes('自动续') && !clauseText.includes('书面通知');

    let hasRisk = false;
    let riskType = clauseType;
    let riskLevel = 'medium';
    let confidence = 0.6;
    let summary = '';
    let quotedText = clauseText.substring(0, 100);

    if (['payment', 'breach', 'confidentiality', 'auto_renewal'].includes(clauseType)) {
      riskType = clauseType;
      if (clauseType === 'payment' && hasPaymentRisk) {
        hasRisk = true;
        riskLevel = clauseText.includes('高额') || clauseText.includes('全额') ? 'high' : 'medium';
        confidence = hasPaymentRisk ? 0.85 : 0.55;
        summary = '该付款条款存在潜在风险：可能包含不利的逾期付款条件或过高的违约金比例。';
      } else if (clauseType === 'breach' && hasBreachRisk) {
        hasRisk = true;
        riskLevel = clauseText.includes('全部损失') || clauseText.includes('间接损失') ? 'high' : 'medium';
        confidence = hasBreachRisk ? 0.82 : 0.5;
        summary = '该违约条款存在潜在风险：赔偿范围可能过大，建议核查是否包含间接损失赔偿。';
      } else if (clauseType === 'confidentiality') {
        hasRisk = hasConfRisk || clauseText.length > 0;
        riskLevel = !clauseText.includes('期限') ? 'high' : 'medium';
        confidence = hasConfRisk ? 0.88 : 0.65;
        summary = !clauseText.includes('期限')
          ? '该保密条款未约定保密期限，可能导致无限期保密义务，存在重大风险。'
          : '该保密条款约定基本合规，建议核查保密范围和例外条款。';
      } else if (clauseType === 'auto_renewal') {
        hasRisk = true;
        riskLevel = hasRenewalRisk ? 'high' : 'medium';
        confidence = hasRenewalRisk ? 0.9 : 0.7;
        summary = hasRenewalRisk
          ? '该自动续约条款存在重大风险：未约定提前书面通知终止的机制，可能导致被动续约。'
          : '该自动续约条款存在风险，建议评估续约周期和通知期限是否合理。';
      }
    }

    return {
      has_risk: hasRisk,
      risk_type: hasRisk ? riskType : null,
      risk_level: hasRisk ? riskLevel : null,
      confidence_score: confidence,
      summary: hasRisk ? summary : '该条款未检测到明显风险，建议结合上下文进行综合判断。',
      quoted_text: quotedText,
      risk_indicators: hasRisk ? [riskType + '_条款风险'] : [],
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
