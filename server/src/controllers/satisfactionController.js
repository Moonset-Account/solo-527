const { Satisfaction, Order, Technician } = require('../models');
const { createAuditLog } = require('../utils/auditLog');

async function getSatisfactionSurveys(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      overallRating,
      store,
      customerService,
      technicianId,
      badReviewReason,
      visitStatus,
      followUpStatus,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (overallRating && overallRating !== 'all') {
      if (overallRating === 'bad') {
        query.overallRating = { $lte: 2 };
      } else if (overallRating === 'medium') {
        query.overallRating = { $eq: 3 };
      } else if (overallRating === 'good') {
        query.overallRating = { $gte: 4 };
      } else {
        query.overallRating = parseInt(overallRating);
      }
    }
    
    if (store) {
      query.store = store;
    }
    
    if (customerService) {
      query.customerService = customerService;
    }
    
    if (technicianId) {
      query.technicianId = technicianId;
    }
    
    if (badReviewReason && badReviewReason !== 'all') {
      query.badReviewReason = badReviewReason;
    }
    
    if (visitStatus && visitStatus !== 'all') {
      query.visitStatus = visitStatus;
    }
    
    if (followUpStatus && followUpStatus !== 'all') {
      query.followUpStatus = followUpStatus;
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
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [surveys, total] = await Promise.all([
      Satisfaction.find(query).sort(sort).skip(skip).limit(limit),
      Satisfaction.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: surveys,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取满意度列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取满意度列表失败',
      error: error.message
    });
  }
}

async function getSatisfactionById(req, res) {
  try {
    const survey = await Satisfaction.findById(req.params.id);
    
    if (!survey) {
      return res.status(404).json({
        success: false,
        message: '满意度调查不存在'
      });
    }
    
    res.json({
      success: true,
      data: survey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取满意度详情失败',
      error: error.message
    });
  }
}

async function createSatisfaction(req, res) {
  try {
    const { orderId, ...surveyData } = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const existing = await Satisfaction.findOne({ orderId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '该订单已有满意度评价'
      });
    }
    
    const survey = new Satisfaction({
      ...surveyData,
      orderId: order._id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      technicianId: order.technicianId,
      technicianName: order.technicianName,
      store: order.store,
      customerService: order.customerService
    });
    
    await survey.save();
    
    if (order.technicianId && survey.overallRating) {
      const allSurveys = await Satisfaction.find({ technicianId: order.technicianId });
      const avgRating = allSurveys.reduce((sum, s) => sum + s.overallRating, 0) / allSurveys.length;
      
      await Technician.findByIdAndUpdate(order.technicianId, {
        rating: Math.round(avgRating * 10) / 10
      });
    }
    
    await createAuditLog({
      action: 'create',
      entityType: 'satisfaction',
      entityId: survey._id,
      entityName: order.orderNo,
      afterData: survey.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `创建满意度评价: ${order.orderNo}, 评分: ${survey.overallRating}`
    });
    
    res.status(201).json({
      success: true,
      message: '满意度评价提交成功',
      data: survey
    });
  } catch (error) {
    console.error('创建满意度错误:', error);
    res.status(500).json({
      success: false,
      message: '提交满意度评价失败',
      error: error.message
    });
  }
}

async function updateSatisfaction(req, res) {
  try {
    const beforeData = await Satisfaction.findById(req.params.id);
    
    if (!beforeData) {
      return res.status(404).json({
        success: false,
        message: '满意度调查不存在'
      });
    }
    
    const survey = await Satisfaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    await createAuditLog({
      action: 'update',
      entityType: 'satisfaction',
      entityId: survey._id,
      entityName: survey.orderNo,
      beforeData: beforeData.toObject(),
      afterData: survey.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `更新满意度评价: ${survey.orderNo}`
    });
    
    res.json({
      success: true,
      message: '满意度评价更新成功',
      data: survey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新满意度评价失败',
      error: error.message
    });
  }
}

async function updateVisitStatus(req, res) {
  try {
    const { visitStatus, visitor, visitRemark } = req.body;
    const surveyId = req.params.id;
    
    const beforeData = await Satisfaction.findById(surveyId);
    if (!beforeData) {
      return res.status(404).json({
        success: false,
        message: '满意度调查不存在'
      });
    }
    
    const survey = await Satisfaction.findByIdAndUpdate(
      surveyId,
      {
        visitStatus,
        visitor: visitor || req.user?.name,
        visitRemark,
        visitTime: visitStatus === 'visited' ? new Date() : beforeData.visitTime
      },
      { new: true }
    );
    
    await createAuditLog({
      action: 'update',
      entityType: 'satisfaction',
      entityId: survey._id,
      entityName: survey.orderNo,
      beforeData: { visitStatus: beforeData.visitStatus },
      afterData: { visitStatus: survey.visitStatus },
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `更新回访状态: ${beforeData.visitStatus} -> ${visitStatus}`
    });
    
    res.json({
      success: true,
      message: '回访状态更新成功',
      data: survey
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新回访状态失败',
      error: error.message
    });
  }
}

async function updateFollowUp(req, res) {
  try {
    const { followUpStatus, followUpRemark, badReviewReason, badReviewDetail } = req.body;
    const surveyId = req.params.id;
    
    const beforeData = await Satisfaction.findById(surveyId);
    if (!beforeData) {
      return res.status(404).json({
        success: false,
        message: '满意度调查不存在'
      });
    }
    
    const updateData = {
      followUpStatus,
      followUpRemark,
      followUpBy: req.user?.name,
      followUpTime: new Date()
    };
    
    if (badReviewReason) {
      updateData.badReviewReason = badReviewReason;
    }
    if (badReviewDetail !== undefined) {
      updateData.badReviewDetail = badReviewDetail;
    }
    
    const survey = await Satisfaction.findByIdAndUpdate(surveyId, updateData, { new: true });
    
    await createAuditLog({
      action: 'update',
      entityType: 'satisfaction',
      entityId: survey._id,
      entityName: survey.orderNo,
      beforeData: { followUpStatus: beforeData.followUpStatus },
      afterData: { followUpStatus: survey.followUpStatus },
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `更新跟进状态: ${beforeData.followUpStatus} -> ${followUpStatus}`
    });
    
    res.json({
      success: true,
      message: '跟进状态更新成功',
      data: survey
    });
  } catch (error) {
    console.error('更新跟进状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新跟进状态失败',
      error: error.message
    });
  }
}

module.exports = {
  getSatisfactionSurveys,
  getSatisfactionById,
  createSatisfaction,
  updateSatisfaction,
  updateVisitStatus,
  updateFollowUp
};
