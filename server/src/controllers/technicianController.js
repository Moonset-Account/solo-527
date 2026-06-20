const { Technician, Order } = require('../models');
const { createAuditLog } = require('../utils/auditLog');

async function getTechnicians(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      status, 
      level,
      store,
      keyword,
      skillCategory,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (level && level !== 'all') {
      query.level = level;
    }
    
    if (store) {
      query.store = store;
    }
    
    if (skillCategory) {
      query.skillCategories = skillCategory;
    }
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [technicians, total] = await Promise.all([
      Technician.find(query).sort(sort).skip(skip).limit(limit),
      Technician.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: technicians,
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
      message: '获取师傅列表失败',
      error: error.message
    });
  }
}

async function getTechnicianById(req, res) {
  try {
    const technician = await Technician.findById(req.params.id);
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: '师傅不存在'
      });
    }
    
    const recentOrders = await Order.find({ 
      technicianId: req.params.id,
      status: { $in: ['completed', 'in_progress', 'assigned'] }
    }).sort({ createdAt: -1 }).limit(10);
    
    res.json({
      success: true,
      data: {
        ...technician.toObject(),
        recentOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取师傅详情失败',
      error: error.message
    });
  }
}

async function createTechnician(req, res) {
  try {
    const technician = new Technician(req.body);
    await technician.save();
    
    await createAuditLog({
      action: 'create',
      entityType: 'technician',
      entityId: technician._id,
      afterData: technician.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `创建师傅账号: ${technician.name}`
    });
    
    res.status(201).json({
      success: true,
      message: '师傅创建成功',
      data: technician
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建师傅失败',
      error: error.message
    });
  }
}

async function updateTechnician(req, res) {
  try {
    const beforeData = await Technician.findById(req.params.id);
    
    if (!beforeData) {
      return res.status(404).json({
        success: false,
        message: '师傅不存在'
      });
    }
    
    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    await createAuditLog({
      action: 'update',
      entityType: 'technician',
      entityId: technician._id,
      beforeData: beforeData.toObject(),
      afterData: technician.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `更新师傅信息: ${technician.name}`
    });
    
    res.json({
      success: true,
      message: '师傅信息更新成功',
      data: technician
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新师傅信息失败',
      error: error.message
    });
  }
}

async function deleteTechnician(req, res) {
  try {
    const technician = await Technician.findById(req.params.id);
    
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: '师傅不存在'
      });
    }
    
    const activeOrders = await Order.countDocuments({
      technicianId: req.params.id,
      status: { $in: ['pending', 'confirmed', 'assigned', 'in_progress'] }
    });
    
    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: '该师傅还有未完成的订单，无法删除'
      });
    }
    
    await Technician.findByIdAndDelete(req.params.id);
    
    await createAuditLog({
      action: 'delete',
      entityType: 'technician',
      entityId: technician._id,
      beforeData: technician.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `删除师傅: ${technician.name}`
    });
    
    res.json({
      success: true,
      message: '师傅删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除师傅失败',
      error: error.message
    });
  }
}

async function getAvailableTechnicians(req, res) {
  try {
    const { skillCategory, store, appointmentTime } = req.query;
    
    const query = {
      status: 'on_duty'
    };
    
    if (skillCategory) {
      query.skillCategories = skillCategory;
    }
    
    if (store) {
      query.store = store;
    }
    
    const technicians = await Technician.find(query)
      .sort({ rating: -1, completedOrders: -1 });
    
    res.json({
      success: true,
      data: technicians
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取可派单师傅失败',
      error: error.message
    });
  }
}

module.exports = {
  getTechnicians,
  getTechnicianById,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  getAvailableTechnicians
};
