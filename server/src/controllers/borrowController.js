const { Borrow, Tool, User, Notification } = require('../models');
const { createAuditLog, sanitizeBorrow } = require('../middleware/permissions');
const { Op } = require('sequelize');

exports.createBorrow = async (req, res) => {
  try {
    const { toolId, borrowDate, expectedReturnDate, purpose } = req.body;
    const userId = req.user.id;

    const tool = await Tool.findByPk(toolId);
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }

    if (tool.status !== 'available') {
      return res.status(400).json({ error: '工具当前不可借用' });
    }

    const conflicts = await Borrow.findAll({
      where: {
        toolId,
        status: { [Op.in]: ['pending', 'approved', 'borrowed'] },
        borrowDate: { [Op.lte]: new Date(expectedReturnDate) },
        expectedReturnDate: { [Op.gte]: new Date(borrowDate) }
      }
    });

    if (conflicts.length > 0) {
      return res.status(400).json({ error: '该时间段工具已被预约', conflicts });
    }

    const initialStatus = tool.isValuable ? 'pending' : 'approved';
    
    const borrow = await Borrow.create({
      toolId,
      userId,
      borrowDate: new Date(borrowDate),
      expectedReturnDate: new Date(expectedReturnDate),
      purpose,
      depositAmount: tool.deposit,
      status: initialStatus
    });

    if (initialStatus === 'approved') {
      await tool.update({ status: 'borrowed', totalBorrows: tool.totalBorrows + 1 });
      borrow.approvedBy = req.user.id;
      borrow.approvedAt = new Date();
      await borrow.save();

      await Notification.create({
        userId,
        type: 'approval',
        title: '借用申请已通过',
        content: `您申请借用的「${tool.name}」已自动通过审核`
      });
    } else {
      const admins = await User.findAll({ where: { role: { [Op.in]: ['admin', 'volunteer'] } } });
      for (const admin of admins) {
        await Notification.create({
          userId: admin.id,
          type: 'approval',
          title: '新的借用申请待审核',
          content: `${req.user.realName || req.user.username} 申请借用「${tool.name}」`,
          relatedId: borrow.id,
          relatedType: 'Borrow'
        });
      }
    }

    await createAuditLog(userId, 'create_borrow', 'Borrow', borrow.id, { toolId, borrowDate, expectedReturnDate }, req.ip);

    await borrow.reload({
      include: [
        { model: Tool, as: 'tool' },
        { model: User, as: 'user', attributes: ['id', 'username', 'realName'] }
      ]
    });

    res.status(201).json({ borrow: sanitizeBorrow(borrow, req.user.role) });
  } catch (error) {
    res.status(500).json({ error: '创建借用申请失败', details: error.message });
  }
};

exports.getMyBorrows = async (req, res) => {
  try {
    const borrows = await Borrow.findAll({
      where: { userId: req.user.id },
      include: [{ model: Tool, as: 'tool' }],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ borrows: borrows.map(b => sanitizeBorrow(b, req.user.role)) });
  } catch (error) {
    res.status(500).json({ error: '获取借用记录失败' });
  }
};

exports.getAllBorrows = async (req, res) => {
  try {
    const { status, userId, toolId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (toolId) where.toolId = toolId;

    const borrows = await Borrow.findAll({
      where,
      include: [
        { model: Tool, as: 'tool' },
        { model: User, as: 'user', attributes: ['id', 'username', 'realName', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ borrows: borrows.map(b => sanitizeBorrow(b, req.user.role)) });
  } catch (error) {
    res.status(500).json({ error: '获取借用记录失败' });
  }
};

exports.approveBorrow = async (req, res) => {
  try {
    const borrow = await Borrow.findByPk(req.params.id, {
      include: [{ model: Tool, as: 'tool' }]
    });

    if (!borrow) {
      return res.status(404).json({ error: '借用记录不存在' });
    }

    if (borrow.status !== 'pending') {
      return res.status(400).json({ error: '该申请状态不允许审核' });
    }

    await borrow.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    await borrow.tool.update({ status: 'borrowed', totalBorrows: borrow.tool.totalBorrows + 1 });

    await Notification.create({
      userId: borrow.userId,
      type: 'approval',
      title: '借用申请已通过',
      content: `您申请借用的「${borrow.tool.name}」已通过审核`
    });

    await createAuditLog(req.user.id, 'approve_borrow', 'Borrow', borrow.id, null, req.ip);

    res.json({ borrow: sanitizeBorrow(borrow, req.user.role) });
  } catch (error) {
    res.status(500).json({ error: '审核失败', details: error.message });
  }
};

exports.rejectBorrow = async (req, res) => {
  try {
    const { rejectReason } = req.body;
    const borrow = await Borrow.findByPk(req.params.id, {
      include: [{ model: Tool, as: 'tool' }]
    });

    if (!borrow) {
      return res.status(404).json({ error: '借用记录不存在' });
    }

    if (borrow.status !== 'pending') {
      return res.status(400).json({ error: '该申请状态不允许审核' });
    }

    await borrow.update({
      status: 'rejected',
      rejectReason,
      approvedBy: req.user.id,
      approvedAt: new Date()
    });

    await Notification.create({
      userId: borrow.userId,
      type: 'approval',
      title: '借用申请被拒绝',
      content: `您申请借用的「${borrow.tool.name}」被拒绝，原因：${rejectReason}`
    });

    await createAuditLog(req.user.id, 'reject_borrow', 'Borrow', borrow.id, { rejectReason }, req.ip);

    res.json({ borrow: sanitizeBorrow(borrow, req.user.role) });
  } catch (error) {
    res.status(500).json({ error: '操作失败', details: error.message });
  }
};

exports.confirmPickup = async (req, res) => {
  try {
    const borrow = await Borrow.findByPk(req.params.id, {
      include: [{ model: Tool, as: 'tool' }]
    });

    if (!borrow) {
      return res.status(404).json({ error: '借用记录不存在' });
    }

    if (borrow.status !== 'approved') {
      return res.status(400).json({ error: '该申请状态不允许取件' });
    }

    await borrow.update({ status: 'borrowed' });
    await createAuditLog(req.user.id, 'confirm_pickup', 'Borrow', borrow.id, null, req.ip);

    res.json({ borrow: sanitizeBorrow(borrow, req.user.role) });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
};

exports.returnTool = async (req, res) => {
  try {
    const { returnNote } = req.body;
    const borrow = await Borrow.findByPk(req.params.id, {
      include: [{ model: Tool, as: 'tool' }]
    });

    if (!borrow) {
      return res.status(404).json({ error: '借用记录不存在' });
    }

    if (!['borrowed', 'overdue'].includes(borrow.status)) {
      return res.status(400).json({ error: '该记录状态不允许归还' });
    }

    const returnPhoto = req.file ? `/uploads/${req.file.filename}` : null;

    await borrow.update({
      status: 'returned',
      actualReturnDate: new Date(),
      returnPhoto,
      returnNote
    });

    await borrow.tool.update({ status: 'available' });

    if (borrow.depositStatus === 'paid') {
      await borrow.update({ depositStatus: 'refunded' });
      const user = await User.findByPk(borrow.userId);
      if (user) {
        await user.update({ balance: parseFloat(user.balance) + parseFloat(borrow.depositAmount) });
      }
    }

    await createAuditLog(req.user.id, 'return_tool', 'Borrow', borrow.id, { returnNote }, req.ip);

    res.json({ borrow: sanitizeBorrow(borrow, req.user.role) });
  } catch (error) {
    res.status(500).json({ error: '归还失败', details: error.message });
  }
};

exports.payDeposit = async (req, res) => {
  try {
    const borrow = await Borrow.findByPk(req.params.id);
    if (!borrow) {
      return res.status(404).json({ error: '借用记录不存在' });
    }

    if (borrow.depositStatus !== 'unpaid') {
      return res.status(400).json({ error: '押金状态不允许支付' });
    }

    const user = req.user;
    if (parseFloat(user.balance) < parseFloat(borrow.depositAmount)) {
      return res.status(400).json({ error: '余额不足' });
    }

    await user.update({ balance: parseFloat(user.balance) - parseFloat(borrow.depositAmount) });
    await borrow.update({ depositStatus: 'paid' });

    await createAuditLog(req.user.id, 'pay_deposit', 'Borrow', borrow.id, { amount: borrow.depositAmount }, req.ip);

    res.json({ borrow: sanitizeBorrow(borrow, req.user.role), balance: user.balance });
  } catch (error) {
    res.status(500).json({ error: '支付失败', details: error.message });
  }
};

exports.reportDamage = async (req, res) => {
  try {
    const { damageNote } = req.body;
    const borrow = await Borrow.findByPk(req.params.id, {
      include: [{ model: Tool, as: 'tool' }]
    });

    if (!borrow) {
      return res.status(404).json({ error: '借用记录不存在' });
    }

    await borrow.update({ status: 'damaged' });
    await borrow.tool.update({ status: 'maintenance' });

    if (borrow.depositStatus === 'paid') {
      await borrow.update({ depositStatus: 'deducted' });
    }

    await createAuditLog(req.user.id, 'report_damage', 'Borrow', borrow.id, { damageNote }, req.ip);

    res.json({ borrow: sanitizeBorrow(borrow, req.user.role) });
  } catch (error) {
    res.status(500).json({ error: '申报失败' });
  }
};
