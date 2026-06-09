require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const logger = require('./utils/logger');
const { testConnection } = require('./db/connection');
const { apiLimiter } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const contractRoutes = require('./routes/contracts');
const riskRoutes = require('./routes/risks');
const reviewQueueRoutes = require('./routes/reviewQueue');
const auditRoutes = require('./routes/audit');
const alertRoutes = require('./routes/alerts');
const clauseListRoutes = require('./routes/clauseLists');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: config.server.nodeEnv === 'production' ? undefined : false,
}));

app.use(cors({
  origin: config.server.nodeEnv === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || true
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  req.startTime = Date.now();
  const requestId = req.headers['x-request-id'] || require('uuid').v4();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  logger.debug(`${req.method} ${req.path}`, {
    request_id: requestId,
    ip: req.ip,
    user_agent: req.headers['user-agent'],
  });

  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - req.startTime;
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      request_id: requestId,
      status_code: res.statusCode,
      duration_ms: duration,
    });
    return originalSend.call(this, data);
  };

  next();
});

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.nodeEnv,
    version: require('../package.json').version,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/review-queue', reviewQueueRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/clause-lists', clauseListRoutes);

const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    request_id: req.requestId,
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: '请求体过大' });
  }

  res.status(err.status || 500).json({
    error: config.server.nodeEnv === 'production'
      ? '服务器内部错误'
      : err.message,
    request_id: req.requestId,
  });
});

app.use((req, res) => {
  if (!req.path.startsWith('/api/')) {
    return res.status(404).json({ error: '未找到页面' });
  }
  res.status(404).json({ error: 'API 端点不存在', path: req.path });
});

const startServer = async () => {
  try {
    logger.info('Starting Contract Risk Annotator Server...');

    await testConnection();

    const uploadDir = path.resolve(config.server.uploadDir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      logger.info(`Created upload directory: ${uploadDir}`);
    }

    const server = app.listen(config.server.port, () => {
      logger.info(`🚀 Server running on http://localhost:${config.server.port}`);
      logger.info(`📊 Environment: ${config.server.nodeEnv}`);
      logger.info(`📁 API base: http://localhost:${config.server.port}/api`);
    });

    const shutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        try {
          const { sequelize } = require('./db/connection');
          await sequelize.close();
          logger.info('Database connection closed.');
        } catch (e) {
          logger.error('Error closing database:', e.message);
        }
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', { reason: reason?.message, stack: reason?.stack });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;
