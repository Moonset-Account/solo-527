const OpenAIService = require('../server/services/openaiService');
const config = require('../server/config');

describe('OpenAIService (Mock Mode)', () => {
  it('should be in mock mode when no API key provided', () => {
    expect(OpenAIService.mockMode).toBe(true);
  });

  it('should return valid mock embedding with correct dimension', async () => {
    const embedding = await OpenAIService.createEmbedding('测试合同条款');
    expect(embedding).toBeDefined();
    expect(embedding.length).toBe(config.vector.dimension);
    const norm = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    expect(norm).toBeGreaterThan(0.9);
    expect(norm).toBeLessThan(1.1);
  });

  it('should detect payment risk from payment clause', async () => {
    const clauseText = `第三条 付款方式
    买方应在货到验收后30日内支付全额货款。逾期支付的，按日0.5%支付违约金，且买方有权终止合同并要求赔偿全部损失。`;

    const result = await OpenAIService.analyzeRisk(clauseText, 'payment');

    expect(result.has_risk).toBe(true);
    expect(result.risk_type).toBe('payment');
    expect(result.confidence_score).toBeGreaterThan(0);
    expect(result.confidence_score).toBeLessThanOrEqual(1);
    expect(result.summary).toBeDefined();
    expect(result.warning).toContain('仅供参考');
    expect(result.quoted_text).toBeDefined();
  });

  it('should detect confidentiality risk', async () => {
    const clauseText = `保密条款
    双方应对本合同内容及对方提供的商业秘密严格保密。`;

    const result = await OpenAIService.analyzeRisk(clauseText, 'confidentiality');
    expect(result.has_risk).toBe(true);
    expect(result.risk_type).toBe('confidentiality');
  });

  it('should detect auto_renewal risk without notice mechanism', async () => {
    const clauseText = `自动续约
    本合同期满后自动续约一年，自动续约次数不限。`;

    const result = await OpenAIService.analyzeRisk(clauseText, 'auto_renewal');
    expect(result.has_risk).toBe(true);
    expect(result.risk_type).toBe('auto_renewal');
    expect(result.confidence_score).toBeGreaterThan(0.6);
  });

  it('should analyze multiple clauses in batch', async () => {
    const clauses = [
      { id: '1', clause_type: 'payment', content: '逾期付款按日5%付违约金' },
      { id: '2', clause_type: 'breach', content: '违约方赔偿全部损失包括间接损失' },
      { id: '3', clause_type: 'confidentiality', content: '保密期限永久' },
    ];

    const results = await OpenAIService.batchAnalyzeRisks(clauses);
    expect(results).toHaveLength(3);
    results.forEach(r => {
      expect(r).toHaveProperty('has_risk');
      expect(r).toHaveProperty('confidence_score');
    });
  });

  it('should return consistent risk result structure', async () => {
    const result = await OpenAIService.analyzeRisk('测试条款内容', 'payment');

    expect(result).toEqual(expect.objectContaining({
      has_risk: expect.any(Boolean),
      risk_type: expect.anything(),
      risk_level: expect.anything(),
      confidence_score: expect.any(Number),
      summary: expect.any(String),
      quoted_text: expect.any(String),
      risk_indicators: expect.any(Array),
      warning: expect.any(String),
    }));
  });
});
