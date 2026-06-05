const cron = require('node-cron');
const { Borrow, Tool, User, Notification } = require('../models');
const { Op } = require('sequelize');

const checkOverdue = async () => {
  try {
    const now = new Date();
    const overdueBorrows = await Borrow.findAll({
      where: {
        status: { [Op.in]: ['borrowed', 'approved'] },
        expectedReturnDate: { [Op.lt]: now }
      },
      include: [
        { model: Tool, as: 'tool' },
        { model: User, as: 'user' }
      ]
    });

    for (const borrow of overdueBorrows) {
      if (borrow.status !== 'overdue') {
        await borrow.update({ status: 'overdue' });

        await Notification.create({
          userId: borrow.userId,
          type: 'overdue',
          title: '工具已逾期',
          content: `您借用的「${borrow.tool.name}」已超过归还日期，请尽快归还`,
          relatedId: borrow.id,
          relatedType: 'Borrow'
        });

        console.log(`标记逾期: Borrow #${borrow.id}`);
      }
    }
  } catch (error) {
    console.error('检查逾期任务出错:', error);
  }
};

const sendReturnReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    now.setHours(0, 0, 0, 0);

    const upcomingReturns = await Borrow.findAll({
      where: {
        status: { [Op.in]: ['borrowed', 'approved'] },
        expectedReturnDate: { [Op.between]: [now, tomorrow] }
      },
      include: [
        { model: Tool, as: 'tool' },
        { model: User, as: 'user' }
      ]
    });

    for (const borrow of upcomingReturns) {
      const existingNotification = await Notification.findOne({
        where: {
          userId: borrow.userId,
          relatedId: borrow.id,
          type: 'return_reminder',
          createdAt: { [Op.gte]: now }
        }
      });

      if (!existingNotification) {
        await Notification.create({
          userId: borrow.userId,
          type: 'return_reminder',
          title: '归还提醒',
          content: `您借用的「${borrow.tool.name}」将于明天到期，请按时归还`,
          relatedId: borrow.id,
          relatedType: 'Borrow'
        });

        console.log(`发送归还提醒: Borrow #${borrow.id} to User #${borrow.userId}`);
      }
    }
  } catch (error) {
    console.error('发送归还提醒出错:', error);
  }
};

const initCronJobs = () => {
  cron.schedule('0 * * * *', () => {
    console.log('执行逾期检查任务...');
    checkOverdue();
  });

  cron.schedule('0 9 * * *', () => {
    console.log('执行归还提醒任务...');
    sendReturnReminders();
  });

  console.log('定时任务已启动');
};

module.exports = { initCronJobs, checkOverdue, sendReturnReminders };
