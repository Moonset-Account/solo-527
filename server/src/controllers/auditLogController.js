const { AuditLog } = require('../models');

async function getAuditLogs(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      action,
      entityType,
      entityId,
      operatorId,
      operatorName,
      startDate,
      endDate,
      keyword,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (action && action !== 'all') {
      query.action = action;
    }
    
    if (entityType && entityType !== 'all') {
      query.entityType = entityType;
    }
    
    if (entityId) {
      query.entityId = entityId;
    }
    
    if (operatorId) {
      query.operatorId = operatorId;
    }
    
    if (operatorName) {
      query.operatorName = { $regex: operatorName, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    if (keyword) {
      query.$or = [
        { entityName: { $regex: keyword, $options: 'i' } },
        { remark: { $regex: keyword, $options: 'i' } },
        { operatorName: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort(sort).skip(skip).limit(limit),
      AuditLog.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取审计日志错误:', error);
    res.status(500).json({
      success: false,
      message: '获取审计日志失败',
      error: error.message
    });
  }
}

async function getAuditLogById(req, res) {
  try {
    const log = await AuditLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '审计日志不存在'
      });
    }
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取审计日志详情失败',
      error: error.message
    });
  }
}

async function getEntityAuditLogs(req, res) {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    
    const query = { entityType, entityId };
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取实体审计日志失败',
      error: error.message
    });
  }
}

async function compareVersions(req, res) {
  try {
    const { logId } = req.params;
    
    const log = await AuditLog.findById(logId);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '审计日志不存在'
      });
    }
    
    const changes = [];
    
    if (log.beforeData && log.afterData) {
      const before = log.beforeData;
      const after = log.afterData;
      
      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
      
      for (const key of allKeys) {
        const beforeVal = before[key];
        const afterVal = after[key];
        
        if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
          changes.push({
            field: key,
            oldValue: beforeVal,
            newValue: afterVal
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        log,
        changes
      }
    });
  } catch (error) {
    console.error('版本对比错误:', error);
    res.status(500).json({
      success: false,
      message: '版本对比失败',
      error: error.message
    });
  }
}

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
  compareVersions
};
