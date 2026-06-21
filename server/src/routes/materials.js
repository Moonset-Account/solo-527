import express from 'express';
import multer from 'multer';
import Material from '../models/Material.js';
import Article from '../models/Article.js';
import Exception from '../models/Exception.js';
import { requireAuth } from '../middleware/auth.js';
import { createAuditLog, compareAndGetChanges } from '../utils/audit.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword = '',
      type = '',
      status = '',
      authStatus = '',
      tag = '',
      category = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (type) query.type = type;
    if (status) query.status = status;
    if (authStatus) query['authorization.status'] = authStatus;
    if (tag) query.tags = tag;
    if (category) query.category = category;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const total = await Material.countDocuments(query);
    const items = await Material.find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .populate('uploader', 'name username role')
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
    const material = await Material.findById(req.params.id)
      .populate('uploader', 'name username role')
      .populate('usedInArticles', 'title status');
    if (!material) {
      return res.status(404).json({ error: '素材不存在' });
    }
    res.json(material);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    const user = req.user;
    const { title, description, type, tags, category, source, author } = req.body;

    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;
    let mimeType = '';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    }

    const material = new Material({
      title: title || fileName,
      description,
      type: type || 'image',
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      category,
      source,
      author,
      uploader: user.id,
      status: 'draft',
      authorization: {
        status: 'unknown',
      },
    });

    await material.save();

    await createAuditLog({
      entityType: 'material',
      entityId: material._id,
      entityTitle: material.title,
      action: 'create',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '上传素材',
    });

    res.status(201).json(material);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const oldMaterial = await Material.findById(req.params.id);
    if (!oldMaterial) {
      return res.status(404).json({ error: '素材不存在' });
    }

    const updates = req.body;
    delete updates._id;
    delete updates.uploader;
    delete updates.usageCount;
    delete updates.usedInArticles;

    Object.assign(oldMaterial, updates);
    await oldMaterial.save();

    const changes = compareAndGetChanges(
      oldMaterial,
      { ...oldMaterial.toObject(), ...updates },
      Object.keys(updates)
    );

    await createAuditLog({
      entityType: 'material',
      entityId: oldMaterial._id,
      entityTitle: oldMaterial.title,
      action: 'update',
      changes,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '更新素材信息',
    });

    res.json(oldMaterial);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: '素材不存在' });
    }

    await Material.findByIdAndDelete(req.params.id);

    await createAuditLog({
      entityType: 'material',
      entityId: material._id,
      entityTitle: material.title,
      action: 'delete',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/tags', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { tags } = req.body;
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: '素材不存在' });
    }

    const oldTags = [...material.tags];
    material.tags = [...new Set([...material.tags, ...tags])];
    await material.save();

    await createAuditLog({
      entityType: 'material',
      entityId: material._id,
      entityTitle: material.title,
      action: 'update',
      changes: [{ field: 'tags', oldValue: oldTags, newValue: material.tags }],
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '更新素材标签',
    });

    res.json(material);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/report-risk', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const material = await Material.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ error: '素材不存在' });
    }

    const { description, severity = 'medium' } = req.body;

    const exceptionNo = 'EXC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const exception = new Exception({
      exceptionNo,
      type: 'authorization_risk',
      severity,
      title: `素材授权风险：${material.title}`,
      description: description || `素材「${material.title}」存在授权风险`,
      relatedType: 'material',
      relatedId: material._id,
      relatedModel: 'Material',
      relatedTitle: material.title,
      materialId: material._id,
      raisedBy: user.id,
      raisedByName: user.name,
      status: 'pending',
    });

    await exception.save();

    material.authorization.status = 'pending';
    await material.save();

    await createAuditLog({
      entityType: 'exception',
      entityId: exception._id,
      entityTitle: exception.title,
      action: 'create',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '素材授权风险异常单',
    });

    res.status(201).json(exception);
  } catch (err) {
    next(err);
  }
});

router.get('/stats/reuse', requireAuth, async (req, res, next) => {
  try {
    const { period = 'month', limit = 10 } = req.query;

    const topReused = await Material.find()
      .sort({ usageCount: -1 })
      .limit(Number(limit))
      .select('title type tags usageCount category')
      .lean();

    const totalMaterials = await Material.countDocuments();
    const totalReused = await Material.countDocuments({ usageCount: { $gt: 0 } });
    const avgReuseRate = totalMaterials > 0 ? (totalReused / totalMaterials * 100).toFixed(2) : 0;

    const authStats = await Material.aggregate([
      { $group: { _id: '$authorization.status', count: { $sum: 1 } } },
    ]);

    const typeStats = await Material.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    res.json({
      topReused,
      summary: {
        totalMaterials,
        totalReused,
        reuseRate: Number(avgReuseRate),
      },
      authStats: authStats.map(s => ({ status: s._id, count: s.count })),
      typeStats: typeStats.map(s => ({ type: s._id, count: s.count })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
