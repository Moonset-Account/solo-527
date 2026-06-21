import express from 'express';
import Schedule from '../models/Schedule.js';
import Article from '../models/Article.js';
import { requireAuth } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { startDate, endDate, platform = '', status = '' } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }
    if (platform) query.platform = platform;
    if (status) query['items.status'] = status;

    const schedules = await Schedule.find(query)
      .sort({ date: 1, platform: 1 })
      .lean();

    res.json(schedules);
  } catch (err) {
    next(err);
  }
});

router.get('/calendar', requireAuth, async (req, res, next) => {
  try {
    const { date, platform } = req.query;

    const query = {};
    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      query.date = { $gte: startOfDay, $lt: endOfDay };
    }
    if (platform) query.platform = platform;

    const schedules = await Schedule.find(query)
      .sort({ date: 1 })
      .lean();

    const items = schedules.flatMap(s =>
      s.items.map(item => ({
        ...item,
        scheduleDate: s.date,
        schedulePlatform: s.platform,
        scheduleId: s._id,
      }))
    );

    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  next();
});

router.get('/:date/:platform', requireAuth, async (req, res, next) => {
  try {
    const { date, platform } = req.params;
    const scheduleDate = new Date(date);

    let schedule = await Schedule.findOne({
      date: scheduleDate,
      platform,
    }).lean();

    if (!schedule) {
      schedule = {
      date: scheduleDate,
      platform,
      items: [],
    };
    }

    res.json(schedule);
  } catch (err) {
    next(err);
  }
});

router.post('/:date/:platform/items', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { date, platform } = req.params;
    const { articleId, articleTitle, scheduledTimeSlot, priority, assignedTo, assignedName, notes } = req.body;

    const scheduleDate = new Date(date);

    let schedule = await Schedule.findOne({ date: scheduleDate, platform });

    if (!schedule) {
      schedule = new Schedule({
        date: scheduleDate,
        platform,
        items: [],
        createdBy: user.id,
        updatedBy: user.id,
      });
    }

    const newItem = {
      id: uuidv4(),
      articleId,
      articleTitle,
      platform,
      scheduledDate: scheduleDate,
      scheduledTimeSlot,
      status: 'scheduled',
      priority: priority || 'normal',
      assignedTo,
      assignedName,
      notes,
      order: (schedule.items || []).length,
    };

    schedule.items.push(newItem);
    schedule.updatedBy = user.id;
    schedule.version = (schedule.version || 1) + 1;
    await schedule.save();

    if (articleId) {
      const article = await Article.findById(articleId);
      if (article) {
        article.scheduledTime = scheduleDate;
        if (!article.platforms?.includes(platform)) {
          article.platforms = [...(article.platforms || []), platform];
        }
        await article.save();
      }
    }

    await createAuditLog({
      entityType: 'schedule',
      entityId: schedule._id,
      entityTitle: `${platform} - ${date}`,
      action: 'update',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: `添加排期项: ${articleTitle}`,
    });

    res.json(newItem);
  } catch (err) {
      next(err);
  }
});

router.put('/:date/:platform/items/:itemId', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { date, platform, itemId } = req.params;

    const scheduleDate = new Date(date);
    const schedule = await Schedule.findOne({ date: scheduleDate, platform });

    if (!schedule) {
      return res.status(404).json({ error: '排期不存在' });
    }

    const itemIndex = schedule.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: '排期项不存在' });
    }

    const oldItem = { ...schedule.items[itemIndex].toObject() };
    Object.assign(schedule.items[itemIndex], req.body);
    schedule.updatedBy = user.id;
    schedule.version = (schedule.version || 1) + 1;
    await schedule.save();

    const changes = [];
    for (const key of Object.keys(req.body)) {
      if (JSON.stringify(oldItem[key]) !== JSON.stringify(req.body[key])) {
        changes.push({
          field: `items.${key}`,
          oldValue: oldItem[key],
          newValue: req.body[key],
        });
      }
    }

    await createAuditLog({
      entityType: 'schedule',
      entityId: schedule._id,
      entityTitle: `${platform} - ${date}`,
      action: 'update',
      changes,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '更新排期项',
    });

    res.json(schedule.items[itemIndex]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:date/:platform/items/:itemId', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { date, platform, itemId } = req.params;

    const scheduleDate = new Date(date);
    const schedule = await Schedule.findOne({ date: scheduleDate, platform });

    if (!schedule) {
      return res.status(404).json({ error: '排期不存在' });
    }

    const item = schedule.items.find(i => i.id === itemId);
    schedule.items = schedule.items.filter(i => i.id !== itemId);
    schedule.updatedBy = user.id;
    schedule.version = (schedule.version || 1) + 1;
    await schedule.save();

    await createAuditLog({
      entityType: 'schedule',
      entityId: schedule._id,
      entityTitle: `${platform} - ${date}`,
      action: 'update',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: `删除排期项: ${item?.articleTitle}`,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/reorder', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { date, platform, itemOrders } = req.body;

    const scheduleDate = new Date(date);
    let schedule = await Schedule.findOne({ date: scheduleDate, platform });

    if (!schedule) {
      return res.status(404).json({ error: '排期不存在' });
    }

    for (const { itemId, order } of itemOrders) {
      const item = schedule.items.find(i => i.id === itemId);
      if (item) {
        item.order = order;
      }
    }

    schedule.items.sort((a, b) => a.order - b.order);
    schedule.updatedBy = user.id;
    schedule.version = (schedule.version || 1) + 1;
    await schedule.save();

    await createAuditLog({
      entityType: 'schedule',
      entityId: schedule._id,
      entityTitle: `${platform} - ${date}`,
      action: 'update',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '调整排期顺序',
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/batch-update', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { items, fromDate, fromPlatform, toDate, toPlatform } = req.body;

    const targetDate = new Date(toDate);
    let targetSchedule = await Schedule.findOne({ date: targetDate, platform: toPlatform });

    if (!targetSchedule) {
      targetSchedule = new Schedule({
        date: targetDate,
        platform: toPlatform,
        items: [],
        createdBy: user.id,
      });
    }

    for (const item of items) {
      const newItem = {
        ...item,
        id: uuidv4(),
        scheduledDate: targetDate,
        platform: toPlatform,
      };
      targetSchedule.items.push(newItem);

      if (item.articleId) {
        const article = await Article.findById(item.articleId);
        if (article) {
          article.scheduledTime = targetDate;
          if (!article.platforms?.includes(toPlatform)) {
            article.platforms = [...(article.platforms || []), toPlatform];
          }
          await article.save();
        }
      }
    }

    targetSchedule.updatedBy = user.id;
    targetSchedule.version = (targetSchedule.version || 1) + 1;
    await targetSchedule.save();

    if (fromDate && fromPlatform) {
      const fromScheduleDate = new Date(fromDate);
      const fromSchedule = await Schedule.findOne({ date: fromScheduleDate, platform: fromPlatform });
      if (fromSchedule) {
        const itemIds = items.map(i => i.id);
        fromSchedule.items = fromSchedule.items.filter(i => !itemIds.includes(i.id));
        fromSchedule.updatedBy = user.id;
        fromSchedule.version = (fromSchedule.version || 1) + 1;
        await fromSchedule.save();
      }
    }

    await createAuditLog({
      entityType: 'schedule',
      entityId: targetSchedule._id,
      entityTitle: `${toPlatform} - ${toDate}`,
      action: 'update',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: `批量调整排期: ${items.length} 项`,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
