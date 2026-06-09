/**
 * Express 服务器主入口
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const logger = require('./utils/logger');
const { initDb, getDb } = require('./db');
const monitoring = require('./monitoring');
const queueManager = require('./queue');
const worker = require('./worker');

const meetingsRoutes = require('./routes/meetings');
const actionItemsRoutes = require('./routes/actionItems');
const mlopsRoutes = require('./routes/mlops');
const inferenceRoutes = require('./routes/inference');

async function startServer() {
  await initDb();

  for (const dir of ['./logs', './data', './data/samples', './uploads']) {
    const p = path.resolve(__dirname, '..', dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  if (config.metrics.enabled) {
    app.use(monitoring.metricsMiddleware);
  }

  app.get('/health', (req, res) => {
    const db = getDb();
    let dbStatus = 'ok';
    try { db.prepare('SELECT 1').get(); } catch { dbStatus = 'error'; }
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: { database: dbStatus },
    });
  });

  const prefix = config.apiPrefix;
  app.use(`${prefix}/meetings`, meetingsRoutes);
  app.use(`${prefix}/action-items`, actionItemsRoutes);
  app.use(`${prefix}/mlops`, mlopsRoutes);
  app.use(`${prefix}/inference`, inferenceRoutes);

  const uiPath = path.resolve(__dirname, '../public');
  if (fs.existsSync(uiPath)) {
    app.use(express.static(uiPath));
    app.get(/^\/(?!api|metrics|health).*/, (req, res) => {
      res.sendFile(path.join(uiPath, 'index.html'));
    });
  }

  app.use((err, req, res, next) => {
    logger.error('Unhandled error', { message: err.message, stack: err.stack, url: req.url });
    res.status(500).json({ code: 500, message: err.message || 'Internal Server Error' });
  });

  try {
    await worker.startAllWorkers();
    logger.info('[server] Queue workers started inline');
  } catch (err) {
    logger.warn(`[server] Workers not started inline (run separately with npm run worker): ${err.message}`);
  }

  const server = app.listen(config.port, () => {
    logger.info(`====================================`);
    logger.info(`  Meeting Action Extractor Server`);
    logger.info(`  Environment: ${config.env}`);
    logger.info(`  Listening on: http://localhost:${config.port}`);
    logger.info(`  API prefix: ${config.apiPrefix}`);
    logger.info(`  Metrics: ${config.metrics.enabled ? `http://localhost:${config.port}${config.metrics.path}` : 'disabled'}`);
    logger.info(`  Health: http://localhost:${config.port}/health`);
    logger.info(`====================================`);
  });

  const graceful = async (signal) => {
    logger.info(`[server] Received ${signal}, shutting down...`);
    server.close(async () => {
      await queueManager.closeAllQueues();
      require('./db').closeDb();
      logger.info('[server] Shutdown complete');
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => graceful('SIGTERM'));
  process.on('SIGINT', () => graceful('SIGINT'));

  return { app, server };
}

if (require.main === module) {
  startServer().catch(err => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
}

module.exports = { startServer };
