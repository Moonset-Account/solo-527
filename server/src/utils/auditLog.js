const AuditLog = require('../models/AuditLog');

async function createAuditLog({ 
  action, 
  entityType, 
  entityId, 
  beforeData, 
  afterData, 
  operatorId, 
  operatorName,
  ipAddress,
  remark 
}) {
  try {
    const auditLog = new AuditLog({
      action,
      entityType,
      entityId,
      beforeData,
      afterData,
      operatorId,
      operatorName,
      ipAddress,
      remark
    });
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('创建审计日志失败:', error);
  }
}

function auditMiddleware(action, entityType, getEntityId = (req) => req.params.id) {
  return async (req, res, next) => {
    const originalJson = res.json;
    let responseData = null;
    
    res.json = function(data) {
      responseData = data;
      return originalJson.call(this, data);
    };
    
    res.on('finish', async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const entityId = typeof getEntityId === 'function' ? getEntityId(req, responseData) : getEntityId;
          
          let afterData = null;
          if (responseData && responseData.data) {
            afterData = responseData.data;
          }
          
          await createAuditLog({
            action,
            entityType,
            entityId: entityId || (afterData && afterData._id),
            afterData,
            beforeData: req.body,
            operatorId: req.user?._id,
            operatorName: req.user?.name,
            ipAddress: req.ip,
            remark: `${action} ${entityType}`
          });
        }
      } catch (error) {
        console.error('审计日志中间件错误:', error);
      }
    });
    
    next();
  };
}

module.exports = {
  createAuditLog,
  auditMiddleware
};
