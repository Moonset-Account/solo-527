const { Part } = require('../models');
const { createAuditLog } = require('../utils/auditLog');

async function getParts(req, res) {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category, 
      status = 'active',
      keyword,
      brand,
      lowStock,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (brand) {
      query.brand = brand;
    }
    
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$minStock'] };
    }
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { sku: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } },
        { model: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize);
    
    const [parts, total] = await Promise.all([
      Part.find(query).sort(sort).skip(skip).limit(limit),
      Part.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: parts,
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
      message: '获取配件列表失败',
      error: error.message
    });
  }
}

async function getPartById(req, res) {
  try {
    const part = await Part.findById(req.params.id);
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: '配件不存在'
      });
    }
    
    res.json({
      success: true,
      data: part
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取配件详情失败',
      error: error.message
    });
  }
}

async function createPart(req, res) {
  try {
    const part = new Part(req.body);
    await part.save();
    
    await createAuditLog({
      action: 'create',
      entityType: 'part',
      entityId: part._id,
      afterData: part.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `创建配件: ${part.name}`
    });
    
    res.status(201).json({
      success: true,
      message: '配件创建成功',
      data: part
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建配件失败',
      error: error.message
    });
  }
}

async function updatePart(req, res) {
  try {
    const beforeData = await Part.findById(req.params.id);
    
    if (!beforeData) {
      return res.status(404).json({
        success: false,
        message: '配件不存在'
      });
    }
    
    const part = await Part.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    await createAuditLog({
      action: 'update',
      entityType: 'part',
      entityId: part._id,
      beforeData: beforeData.toObject(),
      afterData: part.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `更新配件: ${part.name}`
    });
    
    res.json({
      success: true,
      message: '配件更新成功',
      data: part
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新配件失败',
      error: error.message
    });
  }
}

async function deletePart(req, res) {
  try {
    const part = await Part.findById(req.params.id);
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: '配件不存在'
      });
    }
    
    await Part.findByIdAndDelete(req.params.id);
    
    await createAuditLog({
      action: 'delete',
      entityType: 'part',
      entityId: part._id,
      beforeData: part.toObject(),
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `删除配件: ${part.name}`
    });
    
    res.json({
      success: true,
      message: '配件删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除配件失败',
      error: error.message
    });
  }
}

async function updateStock(req, res) {
  try {
    const { quantity, type, remark } = req.body;
    const partId = req.params.id;
    
    const part = await Part.findById(partId);
    if (!part) {
      return res.status(404).json({
        success: false,
        message: '配件不存在'
      });
    }
    
    const beforeStock = part.stock;
    let newStock;
    
    if (type === 'in') {
      newStock = part.stock + quantity;
    } else if (type === 'out') {
      if (part.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: '库存不足'
        });
      }
      newStock = part.stock - quantity;
    } else {
      newStock = quantity;
    }
    
    part.stock = newStock;
    await part.save();
    
    await createAuditLog({
      action: 'update',
      entityType: 'part',
      entityId: part._id,
      beforeData: { stock: beforeStock },
      afterData: { stock: newStock },
      operatorId: req.user?._id,
      operatorName: req.user?.name,
      ipAddress: req.ip,
      remark: `库存变动: ${beforeStock} -> ${newStock} (${remark || type})`
    });
    
    res.json({
      success: true,
      message: '库存更新成功',
      data: part
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新库存失败',
      error: error.message
    });
  }
}

module.exports = {
  getParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
  updateStock
};
