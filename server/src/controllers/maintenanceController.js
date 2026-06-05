const { Maintenance, Tool, User } = require('../models');
const { createAuditLog } = require('../middleware/permissions');

exports.createMaintenance = async (req, res) => {
  try {
    const { toolId, description } = req.body;
    
    const tool = await Tool.findByPk(toolId);
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }

    const photos = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];

    const maintenance = await Maintenance.create({
      toolId,
      reporterId: req.user.id,
      description,
      photos,
      status: 'reported'
    });

    if (tool.status === 'available') {
      await tool.update({ status: 'maintenance' });
    }

    await createAuditLog(req.user.id, 'create_maintenance', 'Maintenance', maintenance.id, { toolId }, req.ip);

    await maintenance.reload({
      include: [
        { model: Tool, as: 'tool' },
        { model: User, as: 'reporter', attributes: ['id', 'username', 'realName'] }
      ]
    });

    res.status(201).json({ maintenance });
  } catch (error) {
    res.status(500).json({ error: '创建维修申报失败', details: error.message });
  }
};

exports.getAllMaintenances = async (req, res) => {
  try {
    const { status, toolId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (toolId) where.toolId = toolId;

    const maintenances = await Maintenance.findAll({
      where,
      include: [
        { model: Tool, as: 'tool' },
        { model: User, as: 'reporter', attributes: ['id', 'username', 'realName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ maintenances });
  } catch (error) {
    res.status(500).json({ error: '获取维修记录失败' });
  }
};

exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { status, repairNote, repairCost } = req.body;
    const maintenance = await Maintenance.findByPk(req.params.id, {
      include: [{ model: Tool, as: 'tool' }]
    });

    if (!maintenance) {
      return res.status(404).json({ error: '维修记录不存在' });
    }

    const updateData = { status };
    if (repairNote !== undefined) updateData.repairNote = repairNote;
    if (repairCost !== undefined) updateData.repairCost = repairCost;

    if (status === 'completed') {
      updateData.repairedBy = req.user.id;
      updateData.repairedAt = new Date();
      
      if (maintenance.tool.status === 'maintenance') {
        await maintenance.tool.update({ status: 'available' });
      }
    }

    if (status === 'repairing') {
      updateData.repairedBy = req.user.id;
    }

    await maintenance.update(updateData);
    await createAuditLog(req.user.id, 'update_maintenance', 'Maintenance', maintenance.id, updateData, req.ip);

    res.json({ maintenance });
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
};

exports.getMyMaintenances = async (req, res) => {
  try {
    const maintenances = await Maintenance.findAll({
      where: { reporterId: req.user.id },
      include: [{ model: Tool, as: 'tool' }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ maintenances });
  } catch (error) {
    res.status(500).json({ error: '获取维修记录失败' });
  }
};
