const FlowRecord = require('../models/FlowRecord');

const createFlowRecord = async (options) => {
  const {
    recordType,
    relatedId,
    relatedNo,
    action,
    actionLabel,
    beforeData,
    afterData,
    description,
    operatorId,
    operatorName,
    operatorRole,
    remark
  } = options;

  const changedFields = [];
  
  if (beforeData && afterData) {
    const allKeys = new Set([
      ...Object.keys(beforeData || {}),
      ...Object.keys(afterData || {})
    ]);
    
    for (const key of allKeys) {
      const beforeVal = JSON.stringify(beforeData[key]);
      const afterVal = JSON.stringify(afterData[key]);
      if (beforeVal !== afterVal) {
        changedFields.push(key);
      }
    }
  }

  const record = new FlowRecord({
    recordType,
    relatedId,
    relatedNo,
    action,
    actionLabel: actionLabel || getActionLabel(action),
    beforeData: beforeData || null,
    afterData: afterData || null,
    changedFields,
    description,
    operatorId,
    operatorName,
    operatorRole,
    remark
  });

  await record.save();
  return record;
};

const getActionLabel = (action) => {
  const labels = {
    create: '创建',
    update: '更新',
    status_change: '状态变更',
    submit: '提交',
    review: '审核',
    complete: '完成',
    cancel: '取消'
  };
  return labels[action] || action;
};

const getFlowRecords = async (query = {}, options = {}) => {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = -1 } = options;
  
  const records = await FlowRecord.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  
  const total = await FlowRecord.countDocuments(query);
  
  return {
    records,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
};

module.exports = {
  createFlowRecord,
  getFlowRecords
};
