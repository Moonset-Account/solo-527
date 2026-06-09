require('dotenv').config();
const path = require('path');
const fs = require('fs');

const dataDir = path.resolve(process.env.DATA_DIR || './data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const vectorDir = path.resolve(process.env.VECTOR_DB_PATH || './data/vectors');
if (!fs.existsSync(vectorDir)) {
  fs.mkdirSync(vectorDir, { recursive: true });
}

module.exports = {
  server: {
    port: parseInt(process.env.SERVER_PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_API_BASE || 'https://api.openai.com/v1',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    chatModel: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    maxRetries: 3,
    timeout: 60000,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  database: {
    sqlitePath: path.resolve(process.env.SQLITE_DB_PATH || './data/app.db'),
    vectorDir,
  },
  thresholds: {
    lowConfidence: parseFloat(process.env.LOW_CONFIDENCE_THRESHOLD) || 0.7,
    confidenceHigh: parseFloat(process.env.CONFIDENCE_HIGH) || 0.85,
    confidenceMedium: parseFloat(process.env.CONFIDENCE_MEDIUM) || 0.70,
    highRiskCategories: (process.env.HIGH_RISK_CATEGORIES || '安全生产,信访维稳,重大疫情,群体性事件')
      .split(',').map(s => s.trim()),
    similarTicketsTopK: 5,
  },
  defaults: {
    admin: {
      email: process.env.ADMIN_DEFAULT_EMAIL || 'admin@community.gov',
      password: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456',
    },
    supervisor: {
      email: process.env.SUPERVISOR_DEFAULT_EMAIL || 'supervisor@community.gov',
      password: process.env.SUPERVISOR_DEFAULT_PASSWORD || 'Super@123456',
    },
    operator: {
      email: process.env.OPERATOR_DEFAULT_EMAIL || 'operator@community.gov',
      password: process.env.OPERATOR_DEFAULT_PASSWORD || 'Oper@123456',
    },
  },
  categories: [
    '环境卫生', '市政设施', '城市管理', '治安消防', '交通出行',
    '住房建设', '劳动保障', '医疗卫生', '教育文化', '民政救助',
    '市场监管', '环境保护', '安全生产', '信访维稳', '重大疫情',
    '群体性事件', '其他民生诉求'
  ],
  urgencyLevels: [
    { level: '特急', score: 4, responseHours: 2, description: '涉及生命安全、重大财产损失风险' },
    { level: '紧急', score: 3, responseHours: 8, description: '涉及较大安全隐患、需立即处置' },
    { level: '一般', score: 2, responseHours: 48, description: '常规诉求、按流程处置' },
    { level: '缓办', score: 1, responseHours: 168, description: '咨询建议类、可延后处置' },
  ],
  departments: [
    { code: 'CSB', name: '城市管理局', categories: ['环境卫生', '市政设施', '城市管理'] },
    { code: 'GAJ', name: '公安局', categories: ['治安消防', '交通出行', '群体性事件'] },
    { code: 'ZJJ', name: '住房和城乡建设局', categories: ['住房建设', '市政设施'] },
    { code: 'RSJ', name: '人力资源和社会保障局', categories: ['劳动保障', '民政救助'] },
    { code: 'WJW', name: '卫生健康委员会', categories: ['医疗卫生', '重大疫情'] },
    { code: 'JYJ', name: '教育局', categories: ['教育文化'] },
    { code: 'MZJ', name: '民政局', categories: ['民政救助', '信访维稳'] },
    { code: 'SCJGJ', name: '市场监督管理局', categories: ['市场监管'] },
    { code: 'STHJJ', name: '生态环境局', categories: ['环境保护'] },
    { code: 'AQSCJ', name: '应急管理局', categories: ['安全生产', '消防'] },
    { code: 'XFJ', name: '信访局', categories: ['信访维稳'] },
    { code: 'JDB', name: '街道办事处', categories: ['其他民生诉求'] },
  ],
};
