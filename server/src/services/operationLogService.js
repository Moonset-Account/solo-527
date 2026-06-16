const OperationLog = require('../models/OperationLog');

const logOperation = async (options) => {
  try {
    const {
      store,
      user,
      module,
      action,
      targetType,
      targetId,
      description,
      fieldChanges,
      req,
      status = 'success',
      errorMessage
    } = options;

    const log = new OperationLog({
      store: store || (user?.store || null),
      user: user?._id || null,
      username: user?.username || user?.name || 'system',
      module,
      action,
      targetType,
      targetId,
      description,
      fieldChanges: fieldChanges || [],
      ip: req?.ip || req?.connection?.remoteAddress || '',
      userAgent: req?.headers?.['user-agent'] || '',
      requestUrl: req?.originalUrl || '',
      requestMethod: req?.method || '',
      status,
      errorMessage
    });

    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create operation log:', error);
    return null;
  }
};

const getFieldChanges = (oldDoc, newDoc, fields) => {
  const changes = [];
  fields.forEach(field => {
    const oldValue = oldDoc?.[field];
    const newValue = newDoc?.[field];
    if (oldValue !== newValue) {
      changes.push({ field, oldValue, newValue });
    }
  });
  return changes;
};

const logMiddleware = (module, action, targetType, getTargetId, fieldsToTrack) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      if (data.success) {
        const targetId = getTargetId ? getTargetId(req, data) : (req.params.id || req.body?._id);
        const fieldChanges = fieldsToTrack && req._oldDoc && req.body
          ? getFieldChanges(req._oldDoc, req.body, fieldsToTrack)
          : [];
        
        logOperation({
          store: req.user?.store,
          user: req.user,
          module,
          action,
          targetType,
          targetId,
          description: `${module} ${action}`,
          fieldChanges,
          req,
          status: 'success'
        });
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  logOperation,
  getFieldChanges,
  logMiddleware
};
