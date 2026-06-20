const { Service, AuditLog } = require('../models');
const { createAuditLog } = require('../utils/auditLog');

async function getServices(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category, 
      status = 'active',
      keyword,
      sortBy = 'sortOrder',
      sortOrder = 'asc'
    } = req.query;
    
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [services, total] = await Promise.all([
      Service.find(query).sort(sort).skip(skip).limit(limit),
      Service.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: services,
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
      message: '获取服务项列表失败',
      error: error.message
    });
  }
}

async function getServiceById(req, res) {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务项不存在'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取服务项详情失败',
      error: error.message
    });
  }
}

async function createService(req, res) {
  try {
    const service = new Service(req.body);
    await service.save();
    
    await createAuditLog({
      action: 'create',
      entityType: 'service',
      entityId: service._id,
      afterData: service.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `创建服务项: ${service.name}`
    });
    
    res.status(201).json({
      success: true,
      message: '服务项创建成功',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建服务项失败',
      error: error.message
    });
  }
}

async function updateService(req, res) {
  try {
    const beforeData = await Service.findById(req.params.id);
    
    if (!beforeData) {
      return res.status(404).json({
        success: false,
        message: '服务项不存在'
      });
    }
    
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    await createAuditLog({
      action: 'update',
      entityType: 'service',
      entityId: service._id,
      beforeData: beforeData.toObject(),
      afterData: service.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `更新服务项: ${service.name}`
    });
    
    res.json({
      success: true,
      message: '服务项更新成功',
      data: service
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新服务项失败',
      error: error.message
    });
  }
}

async function deleteService(req, res) {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: '服务项不存在'
      });
    }
    
    await Service.findByIdAndDelete(req.params.id);
    
    await createAuditLog({
      action: 'delete',
      entityType: 'service',
      entityId: service._id,
      beforeData: service.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `删除服务项: ${service.name}`
    });
    
    res.json({
      success: true,
      message: '服务项删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除服务项失败',
      error: error.message
    });
  }
}

async function getServicesByCategory(req, res) {
  try {
    const { category } = req.params;
    
    const services = await Service.find({ 
      category, 
      status: 'active' 
    }).sort({ sortOrder: 1, name: 1 });
    
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取分类服务项失败',
      error: error.message
    });
  }
}

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCategory
};
