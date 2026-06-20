const { AuditLog, Service, PricingRule, Technician, Part, Order } = require('../models');
const { createAuditLog } = require('../utils/auditLog');

const MODEL_MAP = {
  service: Service,
  pricingrule: PricingRule,
  'pricing-rule': PricingRule,
  pricing_rule: PricingRule,
  technician: Technician,
  part: Part,
  order: Order,
  satisfaction: require('../models/Satisfaction'),
  refund: require('../models/Refund'),
  user: require('../models/User'),
  reschedule: require('../models/RescheduleRecord'),
  reschedulerecord: require('../models/RescheduleRecord'),
  'reschedule-record': require('../models/RescheduleRecord'),
  reschedule_record: require('../models/RescheduleRecord')
};

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

async function restoreEntity(req, res) {
  try {
    const { logId } = req.params;
    const { restoreType, version } = req.body;
    const targetVersion = restoreType || version || 'before';
    
    const log = await AuditLog.findById(logId);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '审计日志不存在'
      });
    }
    
    const entityTypeKey = log.entityType.toLowerCase().replace(/-/g, '_');
    let Model = MODEL_MAP[entityTypeKey] || MODEL_MAP[log.entityType.toLowerCase()] || MODEL_MAP[log.entityType];
    
    if (!Model) {
      for (const key of Object.keys(MODEL_MAP)) {
        if (key.replace(/-/g, '_') === entityTypeKey) {
          Model = MODEL_MAP[key];
          break;
        }
      }
    }
    
    if (!Model) {
      return res.status(400).json({
        success: false,
        message: `不支持的实体类型: ${log.entityType}`
      });
    }
    
    const dataToRestore = targetVersion === 'before' ? log.beforeData : log.afterData;
    
    if (!dataToRestore) {
      return res.status(400).json({
        success: false,
        message: `${targetVersion === 'before' ? '变更前' : '变更后'}数据不存在，无法还原`
      });
    }
    
    const immutableFields = ['_id', 'createdAt', 'updatedAt', '__v', 'orderNo'];
    let beforeRestore = null;
    let restoredEntity = null;
    let isRecreate = false;
    
    let existingEntity = await Model.findById(log.entityId);
    
    if (!existingEntity) {
      if (targetVersion === 'after' && log.action === 'delete') {
        return res.status(400).json({
          success: false,
          message: '实体已被删除，无法还原到"变更后"版本。请选择"变更前"以恢复被删除的数据'
        });
      }
      if (targetVersion === 'before' && log.action === 'create') {
        return res.status(400).json({
          success: false,
          message: '此为创建操作，变更前无数据。删除实体请直接在对应管理页面操作'
        });
      }
      if (targetVersion === 'before' && (log.action === 'delete' || log.action === 'restore')) {
        isRecreate = true;
        const createData = {};
        for (const [key, value] of Object.entries(dataToRestore)) {
          if (!immutableFields.includes(key)) {
            createData[key] = value;
          }
        }
        if (dataToRestore._id) {
          createData._id = dataToRestore._id;
        }
        restoredEntity = new Model(createData);
        await restoredEntity.save();
      } else {
        return res.status(404).json({
          success: false,
          message: '实体不存在，可能已被删除。请检查"变更前/变更后"的选择是否正确'
        });
      }
    } else {
      beforeRestore = existingEntity.toObject();
      
      if (log.action === 'create' && targetVersion === 'before') {
        await Model.findByIdAndDelete(log.entityId);
        restoredEntity = { _id: log.entityId, _deleted: true };
      } else {
        const updateData = {};
        for (const [key, value] of Object.entries(dataToRestore)) {
          if (!immutableFields.includes(key)) {
            updateData[key] = value;
          }
        }
        
        restoredEntity = await Model.findByIdAndUpdate(
          log.entityId,
          updateData,
          { new: true, runValidators: true }
        );
      }
    }
    
    const restoredFields = existingEntity && log.action !== 'create'
      ? Object.keys(dataToRestore).filter(k => !immutableFields.includes(k))
      : ['__recreated__'];
    
    await createAuditLog({
      action: 'restore',
      entityType: log.entityType,
      entityId: log.entityId || (restoredEntity && restoredEntity._id),
      entityName: log.entityName,
      beforeData: beforeRestore,
      afterData: restoredEntity && restoredEntity.toObject ? restoredEntity.toObject() : restoredEntity,
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `${isRecreate ? '重建恢复' : '还原'}：从审计日志[${logId}]还原${targetVersion === 'before' ? '变更前' : '变更后'}版本，原操作: ${log.action} - ${log.remark || ''}`
    });
    
    res.json({
      success: true,
      message: isRecreate ? '数据重建恢复成功' : '数据还原成功',
      data: {
        restoredEntity,
        restoredFields,
        restoredFrom: logId,
        restoreType: targetVersion === 'before' ? '变更前版本' : '变更后版本'
      }
    });
  } catch (error) {
    console.error('数据还原错误:', error);
    res.status(500).json({
      success: false,
      message: '数据还原失败',
      error: error.message
    });
  }
}

async function getEntityVersionTimeline(req, res) {
  try {
    const { entityType, entityId } = req.params;
    
    const logs = await AuditLog.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .select('_id action entityType entityId beforeData afterData createdAt operatorName remark');
    
    res.json({
      success: true,
      data: logs,
      pagination: {
        total: logs.length
      }
    });
  } catch (error) {
    console.error('获取版本时间线错误:', error);
    res.status(500).json({
      success: false,
      message: '获取版本时间线失败',
      error: error.message
    });
  }
}

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
  compareVersions,
  restoreEntity,
  getEntityVersionTimeline
};
