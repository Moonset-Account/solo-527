const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads/portfolio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

async function getPortfolio(req, res) {
  try {
    const { page = 1, pageSize = 10, memberId, treatmentId, status } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (memberId) {
      where.memberId = Number(memberId);
    }

    if (treatmentId) {
      where.treatmentId = Number(treatmentId);
    }

    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.portfolioItem.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { sortOrder: 'asc' },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              memberNo: true,
            },
          },
          treatment: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.portfolioItem.count({ where }),
    ]);

    success(res, {
      list: items,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取作品列表失败', { error: err.message });
    error(res, '获取作品列表失败', 500);
  }
}

async function getPortfolioById(req, res) {
  try {
    const { id } = req.params;

    const item = await prisma.portfolioItem.findUnique({
      where: { id: Number(id) },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            memberNo: true,
          },
        },
        treatment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!item) {
      return error(res, '作品不存在', 404);
    }

    success(res, item, '获取成功');
  } catch (err) {
    logger.error('获取作品详情失败', { error: err.message, id: req.params.id });
    error(res, '获取作品详情失败', 500);
  }
}

async function createPortfolio(req, res) {
  try {
    const { memberId, treatmentId, title, description, image, beforeImage, afterImage, sortOrder, status } = req.body;

    if (!memberId) {
      return error(res, '会员ID不能为空', 400);
    }

    if (!title || title.trim() === '') {
      return error(res, '作品标题不能为空', 400);
    }

    if (!image || image.trim() === '') {
      return error(res, '作品图片不能为空', 400);
    }

    const member = await prisma.member.findUnique({
      where: { id: Number(memberId) },
    });

    if (!member) {
      return error(res, '会员不存在', 404);
    }

    if (treatmentId) {
      const treatment = await prisma.treatment.findUnique({
        where: { id: Number(treatmentId) },
      });
      if (!treatment) {
        return error(res, '疗程不存在', 404);
      }
    }

    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        memberId: Number(memberId),
        treatmentId: treatmentId ? Number(treatmentId) : null,
        title: title.trim(),
        description: description || null,
        image: image.trim(),
        beforeImage: beforeImage || null,
        afterImage: afterImage || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        status: status || 'active',
      },
    });

    await logger.operation(
      req.user.id,
      'create',
      'portfolio',
      portfolioItem.id,
      'portfolioItem',
      `创建作品: ${title}`,
      req
    );

    success(res, portfolioItem, '创建成功', 201);
  } catch (err) {
    logger.error('创建作品失败', { error: err.message });
    error(res, '创建作品失败', 500);
  }
}

async function updatePortfolio(req, res) {
  try {
    const { id } = req.params;
    const { title, description, image, beforeImage, afterImage, sortOrder, status, treatmentId } = req.body;

    const item = await prisma.portfolioItem.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return error(res, '作品不存在', 404);
    }

    if (treatmentId) {
      const treatment = await prisma.treatment.findUnique({
        where: { id: Number(treatmentId) },
      });
      if (!treatment) {
        return error(res, '疗程不存在', 404);
      }
    }

    const updated = await prisma.portfolioItem.update({
      where: { id: Number(id) },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        description: description !== undefined ? description : undefined,
        image: image !== undefined ? image.trim() : undefined,
        beforeImage: beforeImage !== undefined ? beforeImage : undefined,
        afterImage: afterImage !== undefined ? afterImage : undefined,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : undefined,
        status: status !== undefined ? status : undefined,
        treatmentId: treatmentId !== undefined ? Number(treatmentId) : undefined,
      },
    });

    await logger.operation(
      req.user.id,
      'update',
      'portfolio',
      Number(id),
      'portfolioItem',
      `更新作品: ${title || item.title}`,
      req
    );

    success(res, updated, '更新成功');
  } catch (err) {
    logger.error('更新作品失败', { error: err.message, id: req.params.id });
    error(res, '更新作品失败', 500);
  }
}

async function deletePortfolio(req, res) {
  try {
    const { id } = req.params;

    const item = await prisma.portfolioItem.findUnique({
      where: { id: Number(id) },
    });

    if (!item) {
      return error(res, '作品不存在', 404);
    }

    await prisma.portfolioItem.delete({
      where: { id: Number(id) },
    });

    await logger.operation(
      req.user.id,
      'delete',
      'portfolio',
      Number(id),
      'portfolioItem',
      `删除作品: ${item.title}`,
      req
    );

    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除作品失败', { error: err.message, id: req.params.id });
    error(res, '删除作品失败', 500);
  }
}

async function uploadImage(req, res) {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      logger.error('图片上传失败', { error: err.message });
      return error(res, '图片上传失败', 400);
    }

    try {
      if (!req.file) {
        return error(res, '请选择要上传的图片', 400);
      }

      const imagePath = `/uploads/portfolio/${req.file.filename}`;

      await logger.operation(
        req.user.id,
        'upload',
        'portfolio',
        null,
        'portfolioItem',
        '上传作品图片',
        req
      );

      success(res, { url: imagePath }, '上传成功');
    } catch (err) {
      logger.error('图片上传失败', { error: err.message });
      error(res, '图片上传失败', 500);
    }
  });
}

module.exports = {
  getPortfolio,
  getPortfolioById,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  uploadImage,
};
