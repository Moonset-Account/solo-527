require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');
const { initDefaultUsers, initRolePermissions } = require('./services/authService');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const dataRoutes = require('./routes/data');

const app = express();
const PORT = config.server.port;

initDefaultUsers();
initRolePermissions();

app.set('trust proxy', 1);

const logDir = path.resolve('./logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
if (config.server.env !== 'production') {
  app.use(morgan('dev'));
}

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.server.env === 'production' ? 60 : 1000,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { code: 429, message: '登录尝试次数过多，请15分钟后再试' },
});

app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    data: {
      status: 'ok',
      service: 'community-hotline-assistant',
      version: '1.0.0',
      env: config.server.env,
      timestamp: new Date().toISOString(),
      models: {
        embedding: config.openai.embeddingModel,
        chat: config.openai.chatModel,
      },
      thresholds: {
        low_confidence: config.thresholds.lowConfidence,
        high_risk_categories: config.thresholds.highRiskCategories,
      },
    },
  });
});

app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api', apiLimiter, ticketRoutes);
app.use('/api/data', apiLimiter, dataRoutes);

app.use('/', express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ code: 404, message: '接口不存在' });
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, url: req.url });
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: config.server.env === 'production' ? '服务器内部错误' : err.message,
  });
});

const server = app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${config.server.env}`);
  logger.info(`API health check: http://localhost:${PORT}/api/health`);
  if (config.server.env !== 'production') {
    logger.info(`Default admin: ${config.defaults.admin.email} / ${config.defaults.admin.password}`);
    logger.info(`Default supervisor: ${config.defaults.supervisor.email} / ${config.defaults.supervisor.password}`);
    logger.info(`Default operator: ${config.defaults.operator.email} / ${config.defaults.operator.password}`);
  }
});

process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: reason?.message, promise: String(promise) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = { app, server };
