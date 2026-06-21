const { success, error } = require('../utils/response');
const logger = require('../utils/logger');
const prisma = require('../config/prisma');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../../uploads/batch-imports');
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

const IMPORT_TYPES = {
  product: 'product',
  member: 'member',
};

async function validateProductRow(row, rowNumber) {
  const errors = [];

  if (!row.name || String(row.name).trim() === '') {
    errors.push('产品名称不能为空');
  }

  if (!row.sku || String(row.sku).trim() === '') {
    errors.push('SKU 不能为空');
  }

  if (!row.unit || String(row.unit).trim() === '') {
    errors.push('单位不能为空');
  }

  if (row.price !== undefined && row.price !== null && row.price !== '') {
    const price = Number(row.price);
    if (isNaN(price) || price < 0) {
      errors.push('价格必须为非负数字');
    }
  } else {
    errors.push('价格不能为空');
  }

  if (row.stock !== undefined && row.stock !== null && row.stock !== '') {
    const stock = Number(row.stock);
    if (isNaN(stock) || stock < 0) {
      errors.push('库存必须为非负整数');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function validateMemberRow(row, rowNumber) {
  const errors = [];

  if (!row.name || String(row.name).trim() === '') {
    errors.push('姓名不能为空');
  }

  if (!row.phone || String(row.phone).trim() === '') {
    errors.push('手机号不能为空');
  } else if (!/^1[3-9]\d{9}$/.test(String(row.phone).trim())) {
    errors.push('手机号格式不正确');
  }

  if (row.gender && !['男', '女'].includes(String(row.gender).trim())) {
    errors.push('性别必须为"男"或"女"');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function processProductImport(importId, rows) {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;

    const validation = await validateProductRow(row, rowNumber);

    if (!validation.valid) {
      failCount++;
      await prisma.batchImportItem.create({
        data: {
          importId,
          rowNumber,
          data: JSON.stringify(row),
          status: 'failed',
          errorMsg: validation.errors.join('; '),
        },
      });
      continue;
    }

    try {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: String(row.sku).trim() },
      });

      let product;
      if (existingProduct) {
        product = await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: String(row.name).trim(),
            category: row.category ? String(row.category).trim() : null,
            unit: String(row.unit).trim(),
            price: Number(row.price),
            cost: row.cost ? Number(row.cost) : null,
            stock: row.stock ? Number(row.stock) : 0,
            minStock: row.minStock ? Number(row.minStock) : 0,
            description: row.description ? String(row.description).trim() : null,
          },
        });
      } else {
        product = await prisma.product.create({
          data: {
            name: String(row.name).trim(),
            category: row.category ? String(row.category).trim() : null,
            sku: String(row.sku).trim(),
            unit: String(row.unit).trim(),
            price: Number(row.price),
            cost: row.cost ? Number(row.cost) : null,
            stock: row.stock ? Number(row.stock) : 0,
            minStock: row.minStock ? Number(row.minStock) : 0,
            description: row.description ? String(row.description).trim() : null,
          },
        });
      }

      successCount++;
      await prisma.batchImportItem.create({
        data: {
          importId,
          rowNumber,
          productId: product.id,
          data: JSON.stringify(row),
          status: 'success',
        },
      });
    } catch (err) {
      failCount++;
      await prisma.batchImportItem.create({
        data: {
          importId,
          rowNumber,
          data: JSON.stringify(row),
          status: 'failed',
          errorMsg: err.message,
        },
      });
    }
  }

  return { successCount, failCount };
}

async function processMemberImport(importId, rows) {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;

    const validation = await validateMemberRow(row, rowNumber);

    if (!validation.valid) {
      failCount++;
      await prisma.batchImportItem.create({
        data: {
          importId,
          rowNumber,
          data: JSON.stringify(row),
          status: 'failed',
          errorMsg: validation.errors.join('; '),
        },
      });
      continue;
    }

    try {
      const existing = await prisma.member.findUnique({
        where: { phone: String(row.phone).trim() },
      });

      let member;
      const memberNo = 'M' + Date.now().toString().slice(-8) + String(rowNumber).padStart(4, '0');

      if (existing) {
        member = await prisma.member.update({
          where: { id: existing.id },
          data: {
            name: String(row.name).trim(),
            gender: row.gender ? String(row.gender).trim() : null,
            birthday: row.birthday ? new Date(row.birthday) : null,
            level: row.level ? String(row.level).trim() : '普通',
          },
        });
      } else {
        member = await prisma.member.create({
          data: {
            memberNo,
            name: String(row.name).trim(),
            phone: String(row.phone).trim(),
            gender: row.gender ? String(row.gender).trim() : null,
            birthday: row.birthday ? new Date(row.birthday) : null,
            level: row.level ? String(row.level).trim() : '普通',
          },
        });
      }

      successCount++;
      await prisma.batchImportItem.create({
        data: {
          importId,
          rowNumber,
          data: JSON.stringify(row),
          status: 'success',
        },
      });
    } catch (err) {
      failCount++;
      await prisma.batchImportItem.create({
        data: {
          importId,
          rowNumber,
          data: JSON.stringify(row),
          status: 'failed',
          errorMsg: err.message,
        },
      });
    }
  }

  return { successCount, failCount };
}

async function getBatchImports(req, res) {
  try {
    const { page = 1, pageSize = 10, type, status } = req.query;

    const skip = (page - 1) * pageSize;
    const where = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [imports, total] = await Promise.all([
      prisma.batchImport.findMany({
        where,
        skip: Number(skip),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          operator: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      }),
      prisma.batchImport.count({ where }),
    ]);

    success(res, {
      list: imports,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }, '获取成功');
  } catch (err) {
    logger.error('获取批量导入列表失败', { error: err.message });
    error(res, '获取批量导入列表失败', 500);
  }
}

async function getBatchImportById(req, res) {
  try {
    const { id } = req.params;

    const batchImport = await prisma.batchImport.findUnique({
      where: { id: Number(id) },
      include: {
        operator: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        items: {
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!batchImport) {
      return error(res, '导入记录不存在', 404);
    }

    success(res, batchImport, '获取成功');
  } catch (err) {
    logger.error('获取批量导入详情失败', { error: err.message, id: req.params.id });
    error(res, '获取批量导入详情失败', 500);
  }
}

async function createBatchImport(req, res) {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      logger.error('文件上传失败', { error: err.message });
      return error(res, '文件上传失败', 400);
    }

    try {
      const { type } = req.body;

      if (!type || !IMPORT_TYPES[type]) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return error(res, '无效的导入类型', 400);
      }

      if (!req.file) {
        return error(res, '请选择要上传的文件', 400);
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;

      let workbook;
      try {
        workbook = xlsx.readFile(filePath);
      } catch (readErr) {
        fs.unlinkSync(filePath);
        return error(res, 'Excel 文件读取失败，请检查文件格式', 400);
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        fs.unlinkSync(filePath);
        return error(res, 'Excel 文件中没有数据', 400);
      }

      const batchImport = await prisma.batchImport.create({
        data: {
          type,
          fileName,
          filePath,
          totalCount: rows.length,
          status: 'processing',
          operatorId: req.user.id,
        },
      });

      let result;
      if (type === IMPORT_TYPES.product) {
        result = await processProductImport(batchImport.id, rows);
      } else if (type === IMPORT_TYPES.member) {
        result = await processMemberImport(batchImport.id, rows);
      }

      const finalStatus = result.failCount === 0 ? 'completed' : (result.successCount === 0 ? 'failed' : 'partial');

      const updated = await prisma.batchImport.update({
        where: { id: batchImport.id },
        data: {
          successCount: result.successCount,
          failCount: result.failCount,
          status: finalStatus,
        },
      });

      await logger.operation(
        req.user.id,
        'create',
        'batchImport',
        batchImport.id,
        'batchImport',
        `批量导入: ${type}，共 ${rows.length} 条`,
        req
      );

      success(res, updated, '导入完成');
    } catch (err) {
      logger.error('批量导入失败', { error: err.message });
      error(res, '批量导入失败', 500);
    }
  });
}

async function deleteBatchImport(req, res) {
  try {
    const { id } = req.params;

    const batchImport = await prisma.batchImport.findUnique({
      where: { id: Number(id) },
    });

    if (!batchImport) {
      return error(res, '导入记录不存在', 404);
    }

    if (batchImport.filePath && fs.existsSync(batchImport.filePath)) {
      fs.unlinkSync(batchImport.filePath);
    }

    if (batchImport.errorFile && fs.existsSync(batchImport.errorFile)) {
      fs.unlinkSync(batchImport.errorFile);
    }

    await prisma.batchImportItem.deleteMany({
      where: { importId: Number(id) },
    });

    await prisma.batchImport.delete({
      where: { id: Number(id) },
    });

    await logger.operation(
      req.user.id,
      'delete',
      'batchImport',
      Number(id),
      'batchImport',
      `删除导入记录: ${batchImport.fileName}`,
      req
    );

    success(res, null, '删除成功');
  } catch (err) {
    logger.error('删除批量导入记录失败', { error: err.message, id: req.params.id });
    error(res, '删除批量导入记录失败', 500);
  }
}

async function downloadErrors(req, res) {
  try {
    const { id } = req.params;

    const batchImport = await prisma.batchImport.findUnique({
      where: { id: Number(id) },
      include: {
        items: {
          where: { status: 'failed' },
          orderBy: { rowNumber: 'asc' },
        },
      },
    });

    if (!batchImport) {
      return error(res, '导入记录不存在', 404);
    }

    if (batchImport.items.length === 0) {
      return error(res, '没有错误记录', 400);
    }

    const errorData = batchImport.items.map((item) => {
      let rowData = {};
      try {
        rowData = JSON.parse(item.data);
      } catch (e) {
        rowData = { raw: item.data };
      }
      return {
        行号: item.rowNumber,
        错误信息: item.errorMsg,
        ...rowData,
      };
    });

    const worksheet = xlsx.utils.json_to_sheet(errorData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, '错误记录');

    const errorDir = path.join(__dirname, '../../uploads/batch-imports/errors');
    if (!fs.existsSync(errorDir)) {
      fs.mkdirSync(errorDir, { recursive: true });
    }

    const errorFileName = `errors-${id}-${Date.now()}.xlsx`;
    const errorFilePath = path.join(errorDir, errorFileName);
    xlsx.writeFile(workbook, errorFilePath);

    await prisma.batchImport.update({
      where: { id: Number(id) },
      data: { errorFile: errorFilePath },
    });

    res.download(errorFilePath, `导入错误记录-${id}.xlsx`, (downloadErr) => {
      if (downloadErr) {
        logger.error('下载错误记录失败', { error: downloadErr.message });
      }
    });
  } catch (err) {
    logger.error('下载错误记录失败', { error: err.message, id: req.params.id });
    error(res, '下载错误记录失败', 500);
  }
}

async function retryFailedItems(req, res) {
  try {
    const { id } = req.params;

    const batchImport = await prisma.batchImport.findUnique({
      where: { id: Number(id) },
      include: {
        items: {
          where: { status: 'failed' },
        },
      },
    });

    if (!batchImport) {
      return error(res, '导入记录不存在', 404);
    }

    const failedItems = batchImport.items;
    if (failedItems.length === 0) {
      return error(res, '没有需要重试的失败记录', 400);
    }

    const rows = failedItems.map((item) => {
      try {
        return JSON.parse(item.data);
      } catch (e) {
        return {};
      }
    });

    await prisma.batchImportItem.deleteMany({
      where: { importId: Number(id), status: 'failed' },
    });

    let result;
    if (batchImport.type === IMPORT_TYPES.product) {
      result = await processProductImport(batchImport.id, rows);
    } else if (batchImport.type === IMPORT_TYPES.member) {
      result = await processMemberImport(batchImport.id, rows);
    }

    const updatedImport = await prisma.batchImport.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
        items: {
          where: { status: 'success' },
        },
      },
    });

    const successCount = updatedImport.items.length;
    const failCount = updatedImport._count.items - successCount;
    const finalStatus = failCount === 0 ? 'completed' : (successCount === 0 ? 'failed' : 'partial');

    const updated = await prisma.batchImport.update({
      where: { id: Number(id) },
      data: {
        successCount,
        failCount,
        status: finalStatus,
      },
    });

    await logger.operation(
      req.user.id,
      'retry',
      'batchImport',
      Number(id),
      'batchImport',
      `重试失败记录: ${batchImport.fileName}`,
      req
    );

    success(res, updated, '重试完成');
  } catch (err) {
    logger.error('重试失败记录失败', { error: err.message, id: req.params.id });
    error(res, '重试失败', 500);
  }
}

module.exports = {
  getBatchImports,
  getBatchImportById,
  createBatchImport,
  deleteBatchImport,
  downloadErrors,
  retryFailedItems,
  upload,
};
