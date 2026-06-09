const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../server/db/connection');
const models = require('../server/models');
const AlertService = require('../server/services/alertService');

describe('AlertService', () => {
  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ force: true });
    } catch (e) {
      console.log('DB not available, tests may skip DB operations');
    }
  });

  afterAll(async () => {
    try { await sequelize.close(); } catch (e) {}
  });

  it('should create an alert of type data_missing', async () => {
    const alert = await AlertService.create({
      alert_type: 'data_missing',
      severity: 'warning',
      title: '测试数据缺失',
      message: '缺少付款信息',
      missing_fields: ['party_a', 'effective_date'],
      metadata: { test: true },
    }, { force: true });

    expect(alert).toBeDefined();
    expect(alert.alert_type).toBe('data_missing');
    expect(alert.severity).toBe('warning');
    expect(Array.isArray(alert.missing_fields)).toBe(true);
  });

  it('should create service_failure alert with correct structure', async () => {
    const alert = await AlertService.create({
      alert_type: 'service_failure',
      severity: 'error',
      title: 'OpenAI API失败',
      message: 'Timeout error',
      service_name: 'openai',
      error_code: 'ECONNABORTED',
    }, { force: true });

    expect(alert.service_name).toBe('openai');
    expect(alert.status).toBe('active');
  });

  it('should check for missing data fields correctly', async () => {
    const entity = { name: 'test', content: null };
    const alert = await AlertService.checkDataMissing(
      'contract',
      entity,
      ['name', 'party_a', 'effective_date', 'content'],
      uuidv4(),
      null
    );

    expect(alert).toBeDefined();
    expect(alert.missing_fields).toContain('party_a');
    expect(alert.missing_fields).toContain('content');
  });

  it('should detect model drift when threshold exceeded', async () => {
    const baseline = Array(150).fill({ confidence_score: 0.85 });
    const current = Array(50).fill({ confidence_score: 0.55 });

    const result = await AlertService.detectModelDrift(current, baseline, uuidv4());
    expect(result).toBe(true);
  });

  it('should not detect drift when within threshold', async () => {
    const baseline = Array(150).fill({ confidence_score: 0.80 });
    const current = Array(50).fill({ confidence_score: 0.78 });

    const result = await AlertService.detectModelDrift(current, baseline, uuidv4());
    expect(result).toBe(false);
  });
});
