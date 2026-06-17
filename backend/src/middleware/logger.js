const prisma = require('../utils/prisma');

const createOperationLog = async ({ userId, action, module, targetId, targetType, oldValue, newValue, ipAddress }) => {
  try {
    await prisma.operationLog.create({
      data: {
        userId,
        action,
        module,
        targetId,
        targetType,
        oldValue: oldValue ? JSON.stringify(oldValue) : null,
        newValue: newValue ? JSON.stringify(newValue) : null,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('创建操作日志失败:', error);
  }
};

const logOperation = (action, module, getTargetInfo) => {
  return async (req, res, next) => {
    const oldSend = res.send;
    let responseData = null;

    res.send = function (data) {
      responseData = data;
      oldSend.call(this, data);
    };

    res.on('finish', async () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const targetInfo = getTargetInfo ? getTargetInfo(req, responseData) : {};
        await createOperationLog({
          userId: req.user.id,
          action,
          module,
          targetId: targetInfo.targetId,
          targetType: targetInfo.targetType || module,
          oldValue: targetInfo.oldValue,
          newValue: targetInfo.newValue || req.body,
          ipAddress: req.ip || req.connection.remoteAddress,
        });
      }
    });

    next();
  };
};

module.exports = {
  createOperationLog,
  logOperation,
};
