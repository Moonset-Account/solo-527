import express from 'express';
import Dictionary from '../models/Dictionary.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createAuditLog } from '../utils/audit.js';
import { redisClient } from '../config/redis.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { enabledOnly = false } = req.query;

    const cacheKey = `dictionaries:${enabledOnly}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const query = enabledOnly === 'true' ? { enabled: true } : {};

    const dictionaries = await Dictionary.find(query)
      .sort({ name: 1 })
      .lean();

    await redisClient.setEx(cacheKey, 300, JSON.stringify(dictionaries));

    res.json(dictionaries);
  } catch (err) {
    next(err);
  }
});

router.get('/:code', requireAuth, async (req, res, next) => {
  try {
    const { code } = req.params;

    const cacheKey = `dictionary:${code}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const dictionary = await Dictionary.findOne({ code, enabled: true }).lean();
    if (!dictionary) {
      return res.status(404).json({ error: '字典不存在' });
    }

    const items = (dictionary.items || [])
      .filter(item => item.enabled !== false)
      .sort((a, b) => a.sort - b.sort);

    const result = {
      ...dictionary,
      items,
    };

    await redisClient.setEx(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, requireRole(['admin', 'chief_editor']), async (req, res, next) => {
  try {
    const user = req.user;
    const { code, name, description, type, items = [] } = req.body;

    const existing = await Dictionary.findOne({ code });
    if (existing) {
      return res.status(400).json({ error: '字典编码已存在' });
    }

    const dictionary = new Dictionary({
      code,
      name,
      description,
      type: type || 'select',
      items: items.map((item, index) => ({
        ...item,
        sort: item.sort ?? index,
      })),
      createdBy: user.id,
      updatedBy: user.id,
    });

    await dictionary.save();

    await redisClient.del('dictionaries:*');
    await redisClient.del(`dictionary:${code}`);

    await createAuditLog({
      entityType: 'dictionary',
      entityId: dictionary._id,
      entityTitle: dictionary.name,
      action: 'create',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '创建字段字典',
    });

    res.status(201).json(dictionary);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, requireRole(['admin', 'chief_editor']), async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const dictionary = await Dictionary.findById(id);
    if (!dictionary) {
      return res.status(404).json({ error: '字典不存在' });
    }

    if (dictionary.system) {
      return res.status(403).json({ error: '系统字典不可修改' });
    }

    const { name, description, type, items, enabled } = req.body;

    if (name !== undefined) dictionary.name = name;
    if (description !== undefined) dictionary.description = description;
    if (type !== undefined) dictionary.type = type;
    if (items !== undefined) {
      dictionary.items = items.map((item, index) => ({
        ...item,
        sort: item.sort ?? index,
      }));
    }
    if (enabled !== undefined) dictionary.enabled = enabled;
    dictionary.updatedBy = user.id;

    await dictionary.save();

    await redisClient.del('dictionaries:*');
    await redisClient.del(`dictionary:${dictionary.code}`);

    await createAuditLog({
      entityType: 'dictionary',
      entityId: dictionary._id,
      entityTitle: dictionary.name,
      action: 'update',
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: user.role,
      ip: req.ip,
      remark: '更新字段字典',
    });

    res.json(dictionary);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const dictionary = await Dictionary.findById(id);
    if (!dictionary) {
      return res.status(404).json({ error: '字典不存在' });
    }

    if (dictionary.system) {
      return res.status(403).json({ error: '系统字典不可删除' });
    }

    await Dictionary.findByIdAndDelete(id);

    await redisClient.del('dictionaries:*');
    await redisClient.del(`dictionary:${dictionary.code}`);

    await createAuditLog({
      entityType: 'dictionary',
      entityId: dictionary._id,
      entityTitle: dictionary.name,
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

router.post('/init-defaults', requireAuth, requireRole(['admin']), async (req, res, next) => {
  try {
    const user = req.user;
    const defaultDicts = [
      {
        code: 'article_status',
        name: '稿件状态',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '草稿', value: 'draft', color: '#9ca3af', sort: 0 },
          { id: '2', label: '已提交', value: 'submitted', color: '#3b82f6', sort: 1 },
          { id: '3', label: '审核中', value: 'reviewing', color: '#f59e0b', sort: 2 },
          { id: '4', label: '待修改', value: 'revised', color: '#ef4444', sort: 3 },
          { id: '5', label: '已通过', value: 'approved', color: '#10b981', sort: 4 },
          { id: '6', label: '已发布', value: 'published', color: '#059669', sort: 5 },
          { id: '7', label: '已拒绝', value: 'rejected', color: '#dc2626', sort: 6 },
        ],
      },
      {
        code: 'material_type',
        name: '素材类型',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '图片', value: 'image', sort: 0 },
          { id: '2', label: '视频', value: 'video', sort: 1 },
          { id: '3', label: '音频', value: 'audio', sort: 2 },
          { id: '4', label: '文档', value: 'document', sort: 3 },
          { id: '5', label: '其他', value: 'other', sort: 4 },
        ],
      },
      {
        code: 'material_auth_status',
        name: '素材授权状态',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '已授权', value: 'authorized', color: '#10b981', sort: 0 },
          { id: '2', label: '待确认', value: 'pending', color: '#f59e0b', sort: 1 },
          { id: '3', label: '未授权', value: 'unauthorized', color: '#ef4444', sort: 2 },
          { id: '4', label: '未知', value: 'unknown', color: '#9ca3af', sort: 3 },
        ],
      },
      {
        code: 'exception_type',
        name: '异常类型',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '授权风险', value: 'authorization_risk', color: '#ef4444', sort: 0 },
          { id: '2', label: '版权风险', value: 'copyright_risk', color: '#f59e0b', sort: 1 },
          { id: '3', label: '内容风险', value: 'content_risk', color: '#8b5cf6', sort: 2 },
          { id: '4', label: '排期冲突', value: 'schedule_conflict', color: '#3b82f6', sort: 3 },
          { id: '5', label: '其他', value: 'other', color: '#6b7280', sort: 4 },
        ],
      },
      {
        code: 'exception_severity',
        name: '异常严重程度',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '低', value: 'low', color: '#10b981', sort: 0 },
          { id: '2', label: '中', value: 'medium', color: '#f59e0b', sort: 1 },
          { id: '3', label: '高', value: 'high', color: '#f97316', sort: 2 },
          { id: '4', label: '紧急', value: 'critical', color: '#ef4444', sort: 3 },
        ],
      },
      {
        code: 'exception_status',
        name: '异常单状态',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '待处理', value: 'pending', color: '#f59e0b', sort: 0 },
          { id: '2', label: '处理中', value: 'processing', color: '#3b82f6', sort: 1 },
          { id: '3', label: '已办结', value: 'resolved', color: '#10b981', sort: 2 },
          { id: '4', label: '已关闭', value: 'closed', color: '#6b7280', sort: 3 },
        ],
      },
      {
        code: 'priority',
        name: '优先级',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '普通', value: 'normal', color: '#6b7280', sort: 0 },
          { id: '2', label: '重要', value: 'important', color: '#3b82f6', sort: 1 },
          { id: '3', label: '紧急', value: 'urgent', color: '#ef4444', sort: 2 },
        ],
      },
      {
        code: 'platforms',
        name: '发布平台',
        type: 'multi_select',
        system: true,
        items: [
          { id: '1', label: '微信公众号', value: 'wechat', sort: 0 },
          { id: '2', label: '微博', value: 'weibo', sort: 1 },
          { id: '3', label: '今日头条', value: 'toutiao', sort: 2 },
          { id: '4', label: '抖音', value: 'douyin', sort: 3 },
          { id: '5', label: '官方网站', value: 'website', sort: 4 },
          { id: '6', label: 'APP客户端', value: 'app', sort: 5 },
        ],
      },
      {
        code: 'article_categories',
        name: '稿件分类',
        type: 'select',
        system: false,
        items: [
          { id: '1', label: '时政新闻', value: 'politics', sort: 0 },
          { id: '2', label: '财经新闻', value: 'finance', sort: 1 },
          { id: '3', label: '社会新闻', value: 'society', sort: 2 },
          { id: '4', label: '科技新闻', value: 'tech', sort: 3 },
          { id: '5', label: '文化娱乐', value: 'entertainment', sort: 4 },
          { id: '6', label: '体育新闻', value: 'sports', sort: 5 },
        ],
      },
      {
        code: 'user_roles',
        name: '用户角色',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '记者', value: 'reporter', sort: 0 },
          { id: '2', label: '编辑', value: 'editor', sort: 1 },
          { id: '3', label: '主编', value: 'chief_editor', sort: 2 },
          { id: '4', label: '管理员', value: 'admin', sort: 3 },
        ],
      },
      {
        code: 'review_level',
        name: '审稿级别',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '初审', value: 'first', sort: 0 },
          { id: '2', label: '复审', value: 'second', sort: 1 },
          { id: '3', label: '终审', value: 'final', sort: 2 },
        ],
      },
      {
        code: 'feedback_type',
        name: '反馈类型',
        type: 'select',
        system: true,
        items: [
          { id: '1', label: '评论', value: 'comment', sort: 0 },
          { id: '2', label: '建议', value: 'suggestion', sort: 1 },
          { id: '3', label: '疑问', value: 'question', sort: 2 },
          { id: '4', label: '纠错', value: 'correction', sort: 3 },
        ],
      },
    ];

    const results = [];
    for (const dict of defaultDicts) {
      const existing = await Dictionary.findOne({ code: dict.code });
      if (!existing) {
        const newDict = new Dictionary({
          ...dict,
          createdBy: user.id,
          updatedBy: user.id,
        });
        await newDict.save();
        results.push(newDict);
      }
    }

    await redisClient.del('dictionaries:*');

    res.json({
      success: true,
      created: results.length,
      total: defaultDicts.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
