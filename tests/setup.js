process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'contract_risk_test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.OPENAI_API_KEY = 'test-key';

jest.setTimeout(30000);
