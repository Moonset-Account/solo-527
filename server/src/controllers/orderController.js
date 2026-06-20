const { Order, RescheduleRecord, Refund, Technician, Part, Service, Satisfaction } = require('../models');
const { createAuditLog } = require('../utils/auditLog');

async function getOrders(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      status, 
      store,
      customerService,
      technicianId,
      customerPhone,
      applianceType,
      startDate,
      endDate,
      keyword,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
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
    
    if (customerPhone) {
      query.customerPhone = { $regex: customerPhone, $options: 'i' };
    }
    
    if (applianceType && applianceType !== 'all') {
      query.applianceType = applianceType;
    }
    
    if (startDate || endDate) {
      query.appointmentTime = {};
      if (startDate) {
        query.appointmentTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.appointmentTime.$lte = new Date(endDate);
      }
    }
    
    if (keyword) {
      query.$or = [
        { orderNo: { $regex: keyword, $options: 'i' } },
        { customerName: { $regex: keyword, $options: 'i' } },
        { customerPhone: { $regex: keyword, $options: 'i' } },
        { faultDescription: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [orders, total] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(limit),
      Order.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取订单列表失败',
      error: error.message
    });
  }
}

async function getOrderById(req, res) {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const rescheduleRecords = await RescheduleRecord.find({ 
      orderId: req.params.id 
    }).sort({ createdAt: -1 });
    
    const refunds = await Refund.find({ 
      orderId: req.params.id 
    }).sort({ createdAt: -1 });
    
    const satisfaction = await Satisfaction.findOne({ 
      orderId: req.params.id 
    });
    
    res.json({
      success: true,
      data: {
        ...order.toObject(),
        rescheduleRecords,
        refunds,
        satisfaction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取订单详情失败',
      error: error.message
    });
  }
}

async function createOrder(req, res) {
  try {
    const orderData = req.body;
    
    if (!orderData.serviceItems && orderData.serviceId) {
      const service = await Service.findById(orderData.serviceId);
      if (service) {
        orderData.serviceItems = [{
          serviceId: service._id,
          serviceName: service.name,
          basePrice: service.basePrice,
          quantity: 1,
          subtotal: service.basePrice
        }];
        orderData.baseAmount = service.basePrice;
        orderData.totalAmount = service.basePrice;
        orderData.serviceFee = service.serviceFee || 0;
      }
    }
    
    const order = new Order(orderData);
    await order.save();
    
    await createAuditLog({
      action: 'create',
      entityType: 'order',
      entityId: order._id,
      entityName: order.orderNo,
      afterData: order.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `创建订单: ${order.orderNo}`
    });
    
    res.status(201).json({
      success: true,
      message: '订单创建成功',
      data: order
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({
      success: false,
      message: '创建订单失败',
      error: error.message
    });
  }
}

async function updateOrder(req, res) {
  try {
    const beforeData = await Order.findById(req.params.id);
    
    if (!beforeData) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    await createAuditLog({
      action: 'update',
      entityType: 'order',
      entityId: order._id,
      entityName: order.orderNo,
      beforeData: beforeData.toObject(),
      afterData: order.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `更新订单: ${order.orderNo}`
    });
    
    res.json({
      success: true,
      message: '订单更新成功',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新订单失败',
      error: error.message
    });
  }
}

async function assignTechnician(req, res) {
  try {
    const { technicianId, remark } = req.body;
    const orderId = req.params.id;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: '当前订单状态无法派单'
      });
    }
    
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: '师傅不存在'
      });
    }
    
    const beforeData = order.toObject();
    
    order.technicianId = technicianId;
    order.technicianName = technician.name;
    order.technicianFee = technician.serviceFee || 0;
    order.status = 'assigned';
    if (remark) {
      order.remark = remark;
    }
    
    await order.save();
    
    await createAuditLog({
      action: 'assign',
      entityType: 'order',
      entityId: order._id,
      entityName: order.orderNo,
      beforeData,
      afterData: order.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `派单给师傅: ${technician.name}`
    });
    
    res.json({
      success: true,
      message: '派单成功',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '派单失败',
      error: error.message
    });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { status, remark } = req.body;
    const orderId = req.params.id;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['assigned', 'cancelled'],
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed'],
      completed: [],
      cancelled: [],
      refunded: []
    };
    
    if (validTransitions[order.status] && !validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `无法从 ${order.status} 状态变更为 ${status}`
      });
    }
    
    const beforeData = order.toObject();
    
    if (status === 'in_progress') {
      order.actualStartTime = new Date();
    }
    
    if (status === 'completed') {
      order.actualEndTime = new Date();
    }
    
    order.status = status;
    if (remark) {
      order.remark = (order.remark ? order.remark + '\n' : '') + remark;
    }
    
    await order.save();
    
    if (status === 'completed') {
      await Technician.findByIdAndUpdate(order.technicianId, {
        $inc: { completedOrders: 1, totalOrders: 1 }
      });
    }
    
    await createAuditLog({
      action: 'status_change',
      entityType: 'order',
      entityId: order._id,
      entityName: order.orderNo,
      beforeData,
      afterData: order.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `订单状态变更: ${beforeData.status} -> ${status}`
    });
    
    res.json({
      success: true,
      message: '订单状态更新成功',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新订单状态失败',
      error: error.message
    });
  }
}

async function rescheduleOrder(req, res) {
  try {
    const { newTime, reason, reasonDetail, extraFee } = req.body;
    const orderId = req.params.id;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: '当前订单状态无法改约'
      });
    }
    
    const originalTime = order.appointmentTime;
    
    const rescheduleRecord = new RescheduleRecord({
      orderId: order._id,
      orderNo: order.orderNo,
      originalTime,
      newTime,
      reason,
      reasonDetail,
      operatorType: req.user?.role === 'technician' ? 'technician' : 'cs',
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      extraFee: extraFee || 0,
      status: 'approved'
    });
    
    await rescheduleRecord.save();
    
    order.appointmentTime = new Date(newTime);
    order.rescheduleCount = (order.rescheduleCount || 0) + 1;
    
    if (extraFee && extraFee > 0) {
      order.totalAmount = (order.totalAmount || 0) + extraFee;
      order.additionalFees = order.additionalFees || [];
      order.additionalFees.push({
        type: 'reschedule',
        name: '改约费',
        amount: extraFee,
        description: `第${order.rescheduleCount}次改约`
      });
    }
    
    await order.save();
    
    await createAuditLog({
      action: 'reschedule',
      entityType: 'order',
      entityId: order._id,
      entityName: order.orderNo,
      beforeData: { appointmentTime: originalTime },
      afterData: { appointmentTime: newTime },
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `订单改约: ${originalTime} -> ${newTime}`
    });
    
    res.json({
      success: true,
      message: '改约成功',
      data: {
        order,
        rescheduleRecord
      }
    });
  } catch (error) {
    console.error('改约错误:', error);
    res.status(500).json({
      success: false,
      message: '改约失败',
      error: error.message
    });
  }
}

async function getRescheduleRecords(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      orderId,
      reason,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (orderId) {
      query.orderId = orderId;
    }
    
    if (reason && reason !== 'all') {
      query.reason = reason;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [records, total] = await Promise.all([
      RescheduleRecord.find(query).sort(sort).skip(skip).limit(limit),
      RescheduleRecord.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: records,
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
      message: '获取改约记录失败',
      error: error.message
    });
  }
}

async function createRefund(req, res) {
  try {
    const orderId = req.params.id;
    const refundData = req.body;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    if (order.status === 'cancelled' || order.status === 'refunded') {
      return res.status(400).json({
        success: false,
        message: '订单已取消或已退款'
      });
    }
    
    if (refundData.refundAmount > order.totalAmount) {
      return res.status(400).json({
        success: false,
        message: '退款金额不能大于订单金额'
      });
    }
    
    const refund = new Refund({
      ...refundData,
      orderId: order._id,
      orderNo: order.orderNo,
      orderAmount: order.totalAmount,
      applicant: req.user?.name,
      applicantType: req.user?.role === 'customer_service' ? 'cs' : 'admin'
    });
    
    await refund.save();
    
    await createAuditLog({
      action: 'refund',
      entityType: 'order',
      entityId: order._id,
      entityName: order.orderNo,
      beforeData: { status: order.status, paymentStatus: order.paymentStatus },
      afterData: { refundId: refund._id, refundAmount: refund.refundAmount },
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `申请退款: ${refund.refundAmount}元, 原因: ${refund.refundReason}`
    });
    
    res.status(201).json({
      success: true,
      message: '退款申请提交成功',
      data: refund
    });
  } catch (error) {
    console.error('创建退款错误:', error);
    res.status(500).json({
      success: false,
      message: '提交退款申请失败',
      error: error.message
    });
  }
}

async function processRefund(req, res) {
  try {
    const refundId = req.params.refundId;
    const { status, reviewRemark } = req.body;
    
    const refund = await Refund.findById(refundId);
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: '退款申请不存在'
      });
    }
    
    if (refund.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '退款申请已处理'
      });
    }
    
    const beforeData = refund.toObject();
    
    refund.status = status;
    refund.approver = req.user?.name;
    refund.reviewRemark = reviewRemark;
    
    if (status === 'processed') {
      refund.processedTime = new Date();
      
      const order = await Order.findById(refund.orderId);
      if (order) {
        order.paymentStatus = 'refunded';
        order.status = 'refunded';
        order.refundAmount = refund.refundAmount;
        await order.save();
        
        if (refund.partsReturned && refund.returnedParts) {
          for (const returnedPart of refund.returnedParts) {
            await Part.findByIdAndUpdate(returnedPart.partId, {
              $inc: { stock: returnedPart.quantity }
            });
          }
        }
      }
    }
    
    await refund.save();
    
    await createAuditLog({
      action: 'refund',
      entityType: 'refund',
      entityId: refund._id,
      entityName: refund.refundNo,
      beforeData,
      afterData: refund.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `退款${status === 'approved' ? '审批通过' : status === 'rejected' ? '驳回' : '已处理'}: ${refund.refundNo}`
    });
    
    res.json({
      success: true,
      message: '退款处理完成',
      data: refund
    });
  } catch (error) {
    console.error('处理退款错误:', error);
    res.status(500).json({
      success: false,
      message: '处理退款失败',
      error: error.message
    });
  }
}

async function getRefunds(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      status, 
      refundReason,
      orderId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (refundReason && refundReason !== 'all') {
      query.refundReason = refundReason;
    }
    
    if (orderId) {
      query.orderId = orderId;
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [refunds, total] = await Promise.all([
      Refund.find(query).sort(sort).skip(skip).limit(limit),
      Refund.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: refunds,
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
      message: '获取退款列表失败',
      error: error.message
    });
  }
}

async function addOrderParts(req, res) {
  try {
    const { parts } = req.body;
    const orderId = req.params.id;
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    const beforeData = order.toObject();
    order.parts = order.parts || [];
    
    let partsTotal = 0;
    
    for (const partItem of parts) {
      const part = await Part.findById(partItem.partId);
      if (part) {
        const subtotal = part.salePrice * partItem.quantity;
        partsTotal += subtotal;
        
        order.parts.push({
          partId: part._id,
          partName: part.name,
          partSku: part.sku,
          quantity: partItem.quantity,
          unitPrice: part.salePrice,
          costPrice: part.costPrice,
          subtotal
        });
        
        part.stock -= partItem.quantity;
        await part.save();
      }
    }
    
    order.partsAmount = (order.partsAmount || 0) + partsTotal;
    order.totalAmount = (order.baseAmount || 0) + (order.partsAmount || 0) + 
                         (order.serviceFee || 0) + (order.technicianFee || 0);
    
    const additionalTotal = (order.additionalFees || []).reduce((sum, fee) => sum + fee.amount, 0);
    order.totalAmount += additionalTotal;
    order.totalAmount -= order.discountAmount || 0;
    
    order.pricingBreakdown = buildPricingBreakdown(order);
    
    await order.save();
    
    await createAuditLog({
      action: 'update',
      entityType: 'order',
      entityId: order._id,
      entityName: order.orderNo,
      beforeData,
      afterData: order.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `添加配件, 金额: ${partsTotal}元`
    });
    
    res.json({
      success: true,
      message: '配件添加成功',
      data: order
    });
  } catch (error) {
    console.error('添加配件错误:', error);
    res.status(500).json({
      success: false,
      message: '添加配件失败',
      error: error.message
    });
  }
}

async function publicCreateOrder(req, res) {
  try {
    const orderData = { ...req.body };
    const requiredFields = ['customerName', 'customerPhone', 'customerAddress', 
                           'applianceType', 'faultDescription', 'appointmentTime'];
    
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return res.status(400).json({
          success: false,
          message: `缺少必填字段: ${field}`
        });
      }
    }
    
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(orderData.customerPhone)) {
      return res.status(400).json({
        success: false,
        message: '手机号码格式不正确'
      });
    }
    
    const faultPhotos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const photoUrl = `/uploads/fault-photos/${file.filename}`;
        faultPhotos.push(photoUrl);
      }
    }
    
    orderData.faultPhotos = faultPhotos;
    orderData.status = 'pending';
    
    if (orderData.appointmentTime && typeof orderData.appointmentTime === 'string') {
      orderData.appointmentTime = new Date(orderData.appointmentTime);
    }
    
    const order = new Order(orderData);
    await order.save();
    
    await createAuditLog({
      action: 'create',
      entityType: 'order',
      entityId: order._id,
      entityName: order.orderNo,
      afterData: order.toObject(),
      operatorName: '用户端预约',
      ipAddress: req.ip,
      remark: `用户公开预约: ${order.orderNo}, 来源: 官网`
    });
    
    res.status(201).json({
      success: true,
      message: '预约提交成功，我们的客服会尽快与您联系',
      data: {
        orderNo: order.orderNo,
        _id: order._id,
        status: order.status,
        customerName: order.customerName,
        appointmentTime: order.appointmentTime,
        faultPhotos: order.faultPhotos || []
      }
    });
  } catch (error) {
    console.error('公开预约创建错误:', error);
    res.status(500).json({
      success: false,
      message: '预约提交失败',
      error: error.message
    });
  }
}

function buildPricingBreakdown(order) {
  const breakdown = [];
  
  if (order.baseAmount > 0) {
    breakdown.push({ type: 'service', name: '基础服务费', amount: order.baseAmount, description: '维修服务基础费用' });
  }
  
  if (order.serviceFee > 0) {
    breakdown.push({ type: 'service_fee', name: '上门服务费', amount: order.serviceFee, description: '师傅上门费用' });
  }
  
  if (order.technicianFee > 0) {
    breakdown.push({ type: 'technician', name: '师傅服务费', amount: order.technicianFee, description: order.technicianName || '指定师傅费用' });
  }
  
  if (order.partsAmount > 0) {
    breakdown.push({ type: 'parts', name: '配件费用', amount: order.partsAmount, description: '维修配件费用' });
  }
  
  if (order.additionalFees && order.additionalFees.length > 0) {
    for (const fee of order.additionalFees) {
      breakdown.push({ type: fee.type, name: fee.name, amount: fee.amount, description: fee.description });
    }
  }
  
  if (order.discountAmount > 0) {
    breakdown.push({ type: 'discount', name: '优惠折扣', amount: -order.discountAmount, description: '订单优惠' });
  }
  
  return breakdown;
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  assignTechnician,
  updateOrderStatus,
  rescheduleOrder,
  getRescheduleRecords,
  createRefund,
  processRefund,
  getRefunds,
  addOrderParts,
  publicCreateOrder
};
