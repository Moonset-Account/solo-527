const { Tool, Borrow } = require('../models');
const { createAuditLog } = require('../middleware/permissions');
const { Op } = require('sequelize');

exports.getAllTools = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const where = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const tools = await Tool.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({ tools });
  } catch (error) {
    res.status(500).json({ error: '获取工具列表失败' });
  }
};

exports.getToolById = async (req, res) => {
  try {
    const tool = await Tool.findByPk(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }
    res.json({ tool });
  } catch (error) {
    res.status(500).json({ error: '获取工具详情失败' });
  }
};

exports.getToolByQrCode = async (req, res) => {
  try {
    const tool = await Tool.findOne({ where: { qrCode: req.params.qrCode } });
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }
    res.json({ tool });
  } catch (error) {
    res.status(500).json({ error: '获取工具详情失败' });
  }
};

exports.createTool = async (req, res) => {
  try {
    const { name, category, description, deposit, isValuable, location } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const qrCode = `TOOL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const tool = await Tool.create({
      name,
      category,
      description,
      deposit,
      isValuable: isValuable || false,
      location,
      image,
      qrCode,
      status: 'available'
    });

    await createAuditLog(req.user.id, 'create_tool', 'Tool', tool.id, { name, category }, req.ip);

    res.status(201).json({ tool });
  } catch (error) {
    res.status(500).json({ error: '创建工具失败', details: error.message });
  }
};

exports.updateTool = async (req, res) => {
  try {
    const tool = await Tool.findByPk(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }

    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    await tool.update(updateData);
    await createAuditLog(req.user.id, 'update_tool', 'Tool', tool.id, updateData, req.ip);

    res.json({ tool });
  } catch (error) {
    res.status(500).json({ error: '更新工具失败', details: error.message });
  }
};

exports.deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findByPk(req.params.id);
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }

    const activeBorrow = await Borrow.findOne({
      where: {
        toolId: tool.id,
        status: { [Op.in]: ['pending', 'approved', 'borrowed'] }
      }
    });

    if (activeBorrow) {
      return res.status(400).json({ error: '工具存在未完成的借用记录，无法删除' });
    }

    await tool.update({ status: 'retired' });
    await createAuditLog(req.user.id, 'retire_tool', 'Tool', tool.id, null, req.ip);

    res.json({ message: '工具已报废' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
};

exports.getToolCalendar = async (req, res) => {
  try {
    const { toolId, startDate, endDate } = req.query;
    
    const where = { toolId };
    if (startDate && endDate) {
      where.borrowDate = { [Op.lte]: new Date(endDate) };
      where.expectedReturnDate = { [Op.gte]: new Date(startDate) };
      where.status = { [Op.in]: ['approved', 'borrowed'] };
    }

    const borrows = await Borrow.findAll({
      where,
      include: [{ model: require('../models/User'), as: 'user', attributes: ['id', 'username', 'realName'] }]
    });

    res.json({ bookings: borrows });
  } catch (error) {
    res.status(500).json({ error: '获取日历数据失败' });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { toolId, borrowDate, expectedReturnDate } = req.body;
    
    const conflicts = await Borrow.findAll({
      where: {
        toolId,
        status: { [Op.in]: ['pending', 'approved', 'borrowed'] },
        borrowDate: { [Op.lte]: new Date(expectedReturnDate) },
        expectedReturnDate: { [Op.gte]: new Date(borrowDate) }
      }
    });

    res.json({
      available: conflicts.length === 0,
      conflicts
    });
  } catch (error) {
    res.status(500).json({ error: '检查可用性失败' });
  }
};
