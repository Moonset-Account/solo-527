const { Notification, AuditLog, User, Borrow, Tool } = require('../models');
const { Op } = require('sequelize');

exports.getMyNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await Notification.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: '获取通知失败' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ error: '通知不存在' });
    }

    await notification.update({ read: true });
    res.json({ notification });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { read: true },
      { where: { userId: req.user.id, read: false } }
    );
    res.json({ message: '已全部标记为已读' });
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, read: false }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: '获取失败' });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId, userId, limit = 100, offset = 0 } = req.query;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    const logs = await AuditLog.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'realName', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: '获取审计日志失败' });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const totalTools = await Tool.count();
    const availableTools = await Tool.count({ where: { status: 'available' } });
    const borrowedTools = await Tool.count({ where: { status: 'borrowed' } });
    const maintenanceTools = await Tool.count({ where: { status: 'maintenance' } });

    const totalUsers = await User.count();
    const verifiedUsers = await User.count({ where: { verified: true } });

    const totalBorrows = await Borrow.count();
    const pendingBorrows = await Borrow.count({ where: { status: 'pending' } });
    const borrowedBorrows = await Borrow.count({ where: { status: 'borrowed' } });
    const overdueBorrows = await Borrow.count({ where: { status: 'overdue' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBorrows = await Borrow.count({
      where: { createdAt: { [Op.gte]: today } }
    });

    res.json({
      tools: {
        total: totalTools,
        available: availableTools,
        borrowed: borrowedTools,
        maintenance: maintenanceTools
      },
      users: {
        total: totalUsers,
        verified: verifiedUsers
      },
      borrows: {
        total: totalBorrows,
        pending: pendingBorrows,
        borrowed: borrowedBorrows,
        overdue: overdueBorrows,
        today: todayBorrows
      }
    });
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
};
