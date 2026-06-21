import express from 'express';
import Exception from '../models/Exception.js';
import Material from '../models/Material.js';
import { requireAuth } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      status = '',
      type = '',
      severity = '',
      keyword = '',
      raisedBy = '',
      assignee = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (severity) query.severity = severity;
    if (raisedBy) query.raisedBy = raisedBy;
    if (assignee) query.assignee = assignee;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { exceptionNo: { $regex: keyword, $options: 'i' } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const total = await Exception.countDocuments(query);
    const items = await Exception.find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .populate('raisedBy', 'name username')
      .populate('assignee', 'name username')
      .lean();

    res.json({
      items,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const exception = await Exception.findById(req.params.id)
      .populate('raisedBy', 'name username role')
      .populate('assignee', 'name username role')
      .populate('resolvedBy', 'name username')
      .populate('closedBy', 'name username');
    if (!exception) {
      return res.status(404).json({ error: '异常单不存在' });
    }
    res.json(exception);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const {
      type,
      severity = 'medium',
      title,
      description,
      relatedType,
      relatedId,
      relatedTitle,
      materialId,
      articleId,
    } = req.body;

    const exceptionNo = 'EXC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const exception = new Exception({
      exceptionNo,
      type,
      severity,
      title,
      description,
      relatedType,
      relatedId,
      relatedModel: relatedType === 'material' ? 'Material' : relatedType === 'article' ? 'Article' : 'Schedule',
      relatedTitle,
      materialId,
      articleId,
      raisedBy: user.id,
      raisedByName: user.name,
      status: 'pending',
    });

    await exception.save();

    await createAuditLog({
      entityType: 'exception',
      entityId: exception._id,
      entityTitle: exception.title,
      action: 'create',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '创建异常单',
    });

    res.status(201).json(exception);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/assign', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { assignee, assigneeName } = req.body;
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({ error: '异常单不存在' });
    }

    exception.assignee = assignee;
    exception.assigneeName = assigneeName;
    if (exception.status === 'pending') {
      exception.status = 'processing';
    }

    const handlingNote = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      note: `指派给 ${assigneeName} 处理`,
      status: 'assigned',
    };
    exception.handlingNotes = exception.handlingNotes || [];
    exception.handlingNotes.push(handlingNote);

    await exception.save();

    await createAuditLog({
      entityType: 'exception',
      entityId: exception._id,
      entityTitle: exception.title,
      action: 'assign',
      changes: [{ field: 'assignee', oldValue: exception.assignee, newValue: assignee }],
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '指派异常单',
    });

    res.json(exception);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/note', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { note, status } = req.body;
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({ error: '异常单不存在' });
    }

    const handlingNote = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      note,
      status: status || exception.status,
    };

    exception.handlingNotes = exception.handlingNotes || [];
    exception.handlingNotes.push(handlingNote);

    if (status) {
      exception.status = status;
    }

    await exception.save();

    res.json(handlingNote);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/resolve', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { resolution } = req.body;
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({ error: '异常单不存在' });
    }

    exception.status = 'resolved';
    exception.resolution = resolution;
    exception.resolvedAt = new Date();
    exception.resolvedBy = user.id;
    exception.resolvedByName = user.name;

    const handlingNote = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      note: `办结异常单：${resolution}`,
      status: 'resolved',
    };
    exception.handlingNotes = exception.handlingNotes || [];
    exception.handlingNotes.push(handlingNote);

    await exception.save();

    if (exception.materialId && exception.type === 'authorization_risk') {
      const material = await Material.findById(exception.materialId);
      if (material) {
        material.authorization.status = 'authorized';
        material.authorization.note = resolution;
        await material.save();
      }
    }

    await createAuditLog({
      entityType: 'exception',
      entityId: exception._id,
      entityTitle: exception.title,
      action: 'update',
      changes: [
        { field: 'status', oldValue: 'processing', newValue: 'resolved' },
        { field: 'resolution', oldValue: null, newValue: resolution },
      ],
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '办结异常单',
    });

    res.json(exception);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/close', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { closingRemark } = req.body;
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({ error: '异常单不存在' });
    }

    if (exception.status !== 'resolved') {
      return res.status(400).json({ error: '只能关闭已办结的异常单' });
    }

    exception.status = 'closed';
    exception.closedAt = new Date();
    exception.closedBy = user.id;
    exception.closedByName = user.name;
    exception.closingRemark = closingRemark;

    await exception.save();

    await createAuditLog({
      entityType: 'exception',
      entityId: exception._id,
      entityTitle: exception.title,
      action: 'update',
      changes: [
        { field: 'status', oldValue: 'resolved', newValue: 'closed' },
      ],
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '关闭异常单',
    });

    res.json(exception);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const exception = await Exception.findById(req.params.id);

    if (!exception) {
      return res.status(404).json({ error: '异常单不存在' });
    }

    const updates = req.body;
    delete updates._id;
    delete updates.exceptionNo;
    delete updates.raisedBy;

    Object.assign(exception, updates);
    await exception.save();

    await createAuditLog({
      entityType: 'exception',
      entityId: exception._id,
      entityTitle: exception.title,
      action: 'update',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '更新异常单',
    });

    res.json(exception);
  } catch (err) {
    next(err);
  }
});

router.get('/stats/summary', requireAuth, async (req, res, next) => {
  try {
    const statusStats = await Exception.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const typeStats = await Exception.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const severityStats = await Exception.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    res.json({
      statusStats: statusStats.map(s => ({ status: s._id, count: s.count })),
      typeStats: typeStats.map(s => ({ type: s._id, count: s.count })),
      severityStats: severityStats.map(s => ({ severity: s._id, count: s.count })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
