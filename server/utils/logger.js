const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
  level: config.server.nodeEnv === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'contract-risk-annotator' },
  transports: [
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: './logs/combined.log',
      maxsize: 50 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

if (config.server.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
        )
      ),
    })
  );
}

const ensureLogDir = () => {
  const fs = require('fs');
  const path = require('path');
  const logDir = path.resolve('./logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
};

ensureLogDir();

logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
