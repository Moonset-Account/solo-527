const { getFlowRecords } = require('../utils/flowRecord');

const getRecords = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      recordType,
      relatedId,
      action,
      operatorId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = -1
    } = req.query;

    const query = {};
    
    if (recordType) query.recordType = recordType;
    if (relatedId) query.relatedId = relatedId;
    if (action) query.action = action;
    if (operatorId) query.operatorId = operatorId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const result = await getFlowRecords(query, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sortBy,
      sortOrder: parseInt(sortOrder)
    });

    res.json({
      data: result.records,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages
    });
  } catch (error) {
    console.error('Get flow records error:', error);
    res.status(500).json({ message: '获取流转记录失败' });
  }
};

module.exports = {
  getRecords
};
