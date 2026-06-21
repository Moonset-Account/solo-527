const prisma = require('./prisma');

function info(message, data = {}) {
  console.log(`[INFO] ${message}`, data);
}

function error(message, data = {}) {
  console.error(`[ERROR] ${message}`, data);
}

async function operation(userId, action, module, targetId, targetType, detail, req) {
  let ip = '';
  let userAgent = '';

  if (req) {
    ip = req.ip || req.connection?.remoteAddress || '';
    userAgent = req.headers['user-agent'] || '';
  }

  try {
    await prisma.operationLog.create({
      data: {
        userId: userId || null,
        action,
        module,
        targetId: targetId || null,
        targetType: targetType || null,
        detail: detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : null,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error('记录操作日志失败:', err);
  }
}

async function logOperation(options) {
  const {
    userId,
    memberId,
    action,
    module,
    targetId,
    targetType,
    detail,
    req,
  } = options;

  let ip = '';
  let userAgent = '';

  if (req) {
    ip = req.ip || req.connection?.remoteAddress || '';
    userAgent = req.headers['user-agent'] || '';
  }

  try {
    await prisma.operationLog.create({
      data: {
        userId: userId || null,
        memberId: memberId || null,
        action,
        module,
        targetId: targetId || null,
        targetType: targetType || null,
        detail: detail ? JSON.stringify(detail) : null,
        ip,
        userAgent,
      },
    });
  } catch (err) {
    console.error('记录操作日志失败:', err);
  }
}

module.exports = {
  info,
  error,
  operation,
  logOperation,
};
