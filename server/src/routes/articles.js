import express from 'express';
import multer from 'multer';
import Article from '../models/Article.js';
import Material from '../models/Material.js';
import { requireAuth } from '../middleware/auth.js';
import { createAuditLog, compareAndGetChanges } from '../utils/audit.js';
import { v4 as uuidv4 } from 'uuid';

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

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword = '',
      status = '',
      category = '',
      author = '',
      priority = '',
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { subtitle: { $regex: keyword, $options: 'i' } },
        { summary: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;
    if (author) query.author = author;
    if (priority) query.priority = priority;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const total = await Article.countDocuments(query);
    const items = await Article.find(query)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .populate('author', 'name username')
      .select('-content')
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
    const article = await Article.findById(req.params.id)
      .populate('author', 'name username role')
      .populate('createdBy', 'name username')
      .populate('updatedBy', 'name username');
    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }
    res.json(article);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { title, subtitle, summary, content, category, tags, priority, platforms } = req.body;

    const article = new Article({
      title,
      subtitle,
      summary,
      content,
      category,
      tags: tags || [],
      priority: priority || 'normal',
      platforms: platforms || [],
      author: user.id,
      authorName: user.name,
      createdBy: user.id,
      updatedBy: user.id,
      status: 'draft',
      wordCount: content ? content.length : 0,
    });

    await article.save();

    await createAuditLog({
      entityType: 'article',
      entityId: article._id,
      entityTitle: article.title,
      action: 'create',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '创建稿件',
    });

    res.status(201).json(article);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }

    const oldData = article.toObject();
    const updates = req.body;
    delete updates._id;
    delete updates.createdBy;

    if (updates.content) {
      updates.wordCount = updates.content.length;
    }

    updates.updatedBy = user.id;
    Object.assign(article, updates);
    await article.save();

    const changedFields = Object.keys(updates);
    const changes = compareAndGetChanges(
      oldData,
      { ...oldData, ...updates },
      changedFields
    );

    if (changes.length > 0) {
      await createAuditLog({
        entityType: 'article',
        entityId: article._id,
        entityTitle: article.title,
        action: 'update',
        changes,
        operatorId: user.id,
        operatorName: user.name,
        operatorRole: user.role,
        ip: req.ip,
        remark: '更新稿件',
      });
    }

    res.json(article);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { status, remark = '' } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }

    const oldStatus = article.status;
    article.status = status;
    article.updatedBy = user.id;
    await article.save();

    await createAuditLog({
      entityType: 'article',
      entityId: article._id,
      entityTitle: article.title,
      action: 'status_change',
      changes: [{ field: 'status', oldValue: oldStatus, newValue: status }],
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark,
    });

    res.json(article);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/feedback', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { content, type = 'comment' } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }

    const feedback = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      content,
      type,
    };

    article.feedbacks = article.feedbacks || [];
    article.feedbacks.push(feedback);
    article.updatedBy = user.id;
    await article.save();

    res.json(feedback);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/review', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { content, status = 'pending', level = 'first' } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }

    const opinion = {
      id: uuidv4(),
      reviewerId: user.id,
      reviewerName: user.name,
      content,
      status,
      level,
    };

    article.reviewOpinions = article.reviewOpinions || [];
    article.reviewOpinions.push(opinion);
    article.updatedBy = user.id;

    if (status === 'approved' && level === 'final') {
      article.status = 'approved';
    } else if (status === 'rejected') {
      article.status = 'rejected';
    } else if (status === 'needs_revision') {
      article.status = 'revised';
    }

    await article.save();

    await createAuditLog({
      entityType: 'article',
      entityId: article._id,
      entityTitle: article.title,
      action: 'update',
      changes: [{ field: 'reviewOpinion', oldValue: null, newValue: content }],
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: `审稿意见: ${status}`,
    });

    res.json(opinion);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cover', requireAuth, upload.single('image'), async (req, res, next) => {
  try {
    const user = req.user;
    const { title, description, isCurrent = false } = req.body;
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }

    const existingVersions = article.coverVersions || [];
    const version = existingVersions.length + 1;

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    const coverVersion = {
      id: uuidv4(),
      version,
      title,
      imageUrl,
      description,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date(),
      isCurrent: isCurrent || existingVersions.length === 0,
    };

    if (coverVersion.isCurrent) {
      article.coverVersions = (article.coverVersions || []).map(cv => ({
        ...cv,
        isCurrent: false,
      }));
      article.currentCoverId = coverVersion.id;
    }

    article.coverVersions = article.coverVersions || [];
    article.coverVersions.push(coverVersion);
    article.updatedBy = user.id;
    await article.save();

    await createAuditLog({
      entityType: 'article',
      entityId: article._id,
      action: 'add_cover',
      changedBy: user.id,
      changedByName: user.name,
      changes: [{
        field: 'coverVersion',
        oldValue: null,
        newValue: { version, title, imageUrl },
      }],
      metadata: { version },
    });

    res.json(coverVersion);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/cover/:coverId/current', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }

    article.coverVersions = (article.coverVersions || []).map(cv => ({
      ...cv,
      isCurrent: cv.id === req.params.coverId,
    }));
    article.currentCoverId = req.params.coverId;
    article.updatedBy = user.id;
    await article.save();

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/materials', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const { materialId, usageNote } = req.body;
    const article = await Article.findById(req.params.id);
    const material = await Material.findById(materialId);

    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }
    if (!material) {
      return res.status(404).json({ error: '素材不存在' });
    }

    const exists = (article.materials || []).some(m => m.materialId.toString() === materialId);
    if (exists) {
      return res.status(400).json({ error: '素材已关联' });
    }

    article.materials = article.materials || [];
    article.materials.push({
      materialId,
      usageNote,
      addedAt: new Date(),
    });

    material.usageCount = (material.usageCount || 0) + 1;
    if (!material.usedInArticles.includes(article._id)) {
      material.usedInArticles.push(article._id);
    }

    article.updatedBy = user.id;
    await article.save();
    await material.save();

    res.json(article.materials);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/materials/:materialId', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const article = await Article.findById(req.params.id);
    const material = await Material.findById(req.params.materialId);

    if (!article) {
      return res.status(404).json({ error: '稿件不存在' });
    }

    article.materials = (article.materials || []).filter(
      m => m.materialId.toString() !== req.params.materialId
    );

    if (material) {
      material.usageCount = Math.max(0, (material.usageCount || 0) - 1);
      material.usedInArticles = (material.usedInArticles || []).filter(
        id => id.toString() !== article._id.toString()
      );
      await material.save();
    }

    article.updatedBy = user.id;
    await article.save();

    res.json(article.materials);
  } catch (err) {
    next(err);
  }
});

export default router;
