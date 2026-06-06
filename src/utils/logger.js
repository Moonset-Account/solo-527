const winston = require('winston');
const fs = require('fs');
const path = require('path');
const db = require('../db');

const logDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

async function logToDatabase(level, error, req = null) {
  try {
    const errorType = error.name || 'Unknown';
    const message = error.message || String(error);
    const stackTrace = error.stack || null;
    
    const userId = req?.user?.id || null;
    const requestPath = req?.originalUrl || null;
    const requestMethod = req?.method || null;
    const requestParams = req ? {
      body: req.body,
      query: req.query,
      params: req.params,
    } : null;
    const ipAddress = req?.ip || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    await db.query(`
      INSERT INTO error_logs 
      (error_level, error_type, message, stack_trace, user_id, request_path, 
       request_method, request_params, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [level, errorType, message, stackTrace, userId, requestPath, 
        requestMethod, JSON.stringify(requestParams), ipAddress, userAgent]);
  } catch (dbError) {
    logger.error('Failed to log to database:', dbError);
  }
}

async function logAudit(userId, userName, action, module, targetType = null, targetId = null, oldValue = null, newValue = null, req = null) {
  try {
    const ipAddress = req?.ip || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    await db.query(`
      INSERT INTO audit_logs 
      (user_id, user_name, action, module, target_type, target_id, old_value, new_value, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [userId, userName, action, module, targetType, targetId, 
        oldValue ? JSON.stringify(oldValue) : null, 
        newValue ? JSON.stringify(newValue) : null, 
        ipAddress, userAgent]);
  } catch (error) {
    logger.error('Failed to log audit:', error);
  }
}

module.exports = {
  logger,
  logToDatabase,
  logAudit,
};
