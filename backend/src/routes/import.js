const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const prisma = require('../utils/prisma');
const { authenticate, requireDirector } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const generateBatchNo = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  return `IMP${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${timestamp}`;
};

const formatError = (rowIndex, field, message, value) => ({
  rowNumber: rowIndex + 2,
  field,
  value: value !== undefined && value !== null ? String(value) : '',
  message,
});

const equipmentFieldMap = {
  '设备编号*': 'code',
  '设备编号': 'code',
  '设备名称*': 'name',
  '设备名称': 'name',
  '设备型号': 'model',
  '设备类型': 'type',
  '所属车间': 'workshop',
  '二维码': 'qrCode',
  '备注': 'remark',
};

const workOrderFieldMap = {
  '工单号*': 'orderNo',
  '工单号': 'orderNo',
  '产品名称*': 'productName',
  '产品名称': 'productName',
  '计划数量*': 'plannedQuantity',
  '计划数量': 'plannedQuantity',
  '客户名称': 'customer',
  '交货日期 (YYYY-MM-DD)': 'deliveryDate',
  '交货日期': 'deliveryDate',
  '备注': 'remark',
};

const mapRowToFields = (row, fieldMap) => {
  const mapped = {};
  for (const [key, value] of Object.entries(row)) {
    const fieldName = fieldMap[key.trim()] || key.trim();
    mapped[fieldName] = value;
  }
  return mapped;
};

const getFieldDisplayName = (field, fieldMap) => {
  for (const [displayName, internalName] of Object.entries(fieldMap)) {
    if (internalName === field) {
      return displayName.replace('*', '');
    }
  }
  return field;
};

const validateEquipmentRow = (row, index) => {
  const errors = [];
  const mapped = mapRowToFields(row, equipmentFieldMap);

  if (!mapped.code || String(mapped.code).trim() === '') {
    errors.push(formatError(index, getFieldDisplayName('code', equipmentFieldMap), '设备编号不能为空', mapped.code));
  }
  if (!mapped.name || String(mapped.name).trim() === '') {
    errors.push(formatError(index, getFieldDisplayName('name', equipmentFieldMap), '设备名称不能为空', mapped.name));
  }
  if (!mapped.qrCode || String(mapped.qrCode).trim() === '') {
    errors.push(formatError(index, getFieldDisplayName('qrCode', equipmentFieldMap), '二维码不能为空', mapped.qrCode));
  }

  return { errors, mapped };
};

const validateWorkOrderRow = (row, index) => {
  const errors = [];
  const mapped = mapRowToFields(row, workOrderFieldMap);

  if (!mapped.orderNo || String(mapped.orderNo).trim() === '') {
    errors.push(formatError(index, getFieldDisplayName('orderNo', workOrderFieldMap), '工单号不能为空', mapped.orderNo));
  }
  if (!mapped.productName || String(mapped.productName).trim() === '') {
    errors.push(formatError(index, getFieldDisplayName('productName', workOrderFieldMap), '产品名称不能为空', mapped.productName));
  }
  if (!mapped.plannedQuantity || isNaN(Number(mapped.plannedQuantity)) || Number(mapped.plannedQuantity) <= 0) {
    errors.push(formatError(index, getFieldDisplayName('plannedQuantity', workOrderFieldMap), '计划数量必须是大于0的数字', mapped.plannedQuantity));
  }

  return { errors, mapped };
};

const parseExcelDate = (value) => {
  if (value === null || value === undefined || value === '') return null;
  try {
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return new Date(date.y, date.m - 1, date.d);
    }
    const dateStr = String(value).trim();
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch (e) {
    return null;
  }
};

router.use(authenticate, requireDirector);

router.post('/equipment', upload.single('file'),
  logOperation('IMPORT', 'EQUIPMENT'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ code: 400, message: '请上传文件' });
      }

      const batchNo = generateBatchNo();
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        return res.status(400).json({ code: 400, message: '文件中没有数据' });
      }

      let allErrors = [];
      const validRows = [];

      rows.forEach((row, index) => {
        const { errors, mapped } = validateEquipmentRow(row, index);
        if (errors.length > 0) {
          allErrors = allErrors.concat(errors);
        } else {
          validRows.push({ ...mapped, originalIndex: index });
        }
      });

      let successCount = 0;
      let failCount = allErrors.length;

      if (validRows.length > 0) {
        const existingCodes = await prisma.equipment.findMany({
          where: { code: { in: validRows.map(r => String(r.code).trim()) } },
          select: { code: true },
        });
        const existingCodeSet = new Set(existingCodes.map(e => e.code));

        const existingQRCodes = await prisma.equipment.findMany({
          where: { qrCode: { in: validRows.map(r => String(r.qrCode).trim()) } },
          select: { qrCode: true },
        });
        const existingQRCodeSet = new Set(existingQRCodes.map(e => e.qrCode));

        const toCreate = [];
        validRows.forEach((row) => {
          const code = String(row.code).trim();
          const qrCode = String(row.qrCode).trim();

          if (existingCodeSet.has(code)) {
            allErrors.push(formatError(row.originalIndex, getFieldDisplayName('code', equipmentFieldMap), '设备编号已存在', code));
            failCount++;
          } else if (existingQRCodeSet.has(qrCode)) {
            allErrors.push(formatError(row.originalIndex, getFieldDisplayName('qrCode', equipmentFieldMap), '二维码已存在', qrCode));
            failCount++;
          } else {
            toCreate.push({
              code,
              name: String(row.name).trim(),
              model: row.model ? String(row.model).trim() : null,
              qrCode,
              location: row.workshop ? String(row.workshop).trim() : null,
              description: row.remark ? String(row.remark).trim() : null,
              status: 'IDLE',
            });
          }
        });

        if (toCreate.length > 0) {
          await prisma.equipment.createMany({ data: toCreate });
          successCount = toCreate.length;
        }
      }

      let status = 'COMPLETED';
      if (failCount > 0 && successCount > 0) status = 'PARTIAL';
      if (failCount === rows.length) status = 'FAILED';

      const batch = await prisma.importBatch.create({
        data: {
          batchNo,
          type: 'EQUIPMENT',
          fileName: req.file.originalname,
          totalCount: rows.length,
          successCount,
          failCount,
          status,
          errors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
          operatorName: req.user.name,
          processedAt: new Date(),
        },
      });

      res.json({
        code: 200,
        message: status === 'COMPLETED' ? '导入成功' : (status === 'PARTIAL' ? '部分导入成功' : '导入失败'),
        data: {
          ...batch,
          errors: allErrors,
          totalCount: rows.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/workorder', upload.single('file'),
  logOperation('IMPORT', 'WORK_ORDER'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ code: 400, message: '请上传文件' });
      }

      const batchNo = generateBatchNo();
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        return res.status(400).json({ code: 400, message: '文件中没有数据' });
      }

      let allErrors = [];
      const validRows = [];

      rows.forEach((row, index) => {
        const { errors, mapped } = validateWorkOrderRow(row, index);
        if (errors.length > 0) {
          allErrors = allErrors.concat(errors);
        } else {
          validRows.push({ ...mapped, originalIndex: index });
        }
      });

      let successCount = 0;
      let failCount = allErrors.length;

      if (validRows.length > 0) {
        const existingOrderNos = await prisma.workOrder.findMany({
          where: { orderNo: { in: validRows.map(r => String(r.orderNo).trim()) } },
          select: { orderNo: true },
        });
        const existingSet = new Set(existingOrderNos.map(w => w.orderNo));

        const toCreate = [];
        validRows.forEach((row) => {
          const orderNo = String(row.orderNo).trim();
          if (existingSet.has(orderNo)) {
            allErrors.push(formatError(row.originalIndex, getFieldDisplayName('orderNo', workOrderFieldMap), '工单号已存在', orderNo));
            failCount++;
          } else {
            const deliveryDate = parseExcelDate(row.deliveryDate);

            toCreate.push({
              orderNo,
              productName: String(row.productName).trim(),
              productCode: orderNo,
              plannedQuantity: Number(row.plannedQuantity),
              quantity: Number(row.plannedQuantity),
              customer: row.customer ? String(row.customer).trim() : null,
              deliveryDate,
              plannedDate: deliveryDate || new Date(),
              status: 'DRAFT',
              remark: row.remark ? String(row.remark).trim() : null,
            });
          }
        });

        if (toCreate.length > 0) {
          await prisma.workOrder.createMany({ data: toCreate });
          successCount = toCreate.length;
        }
      }

      let status = 'COMPLETED';
      if (failCount > 0 && successCount > 0) status = 'PARTIAL';
      if (failCount === rows.length) status = 'FAILED';

      const batch = await prisma.importBatch.create({
        data: {
          batchNo,
          type: 'WORK_ORDER',
          fileName: req.file.originalname,
          totalCount: rows.length,
          successCount,
          failCount,
          status,
          errors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
          operatorName: req.user.name,
          processedAt: new Date(),
        },
      });

      res.json({
        code: 200,
        message: status === 'COMPLETED' ? '导入成功' : (status === 'PARTIAL' ? '部分导入成功' : '导入失败'),
        data: {
          ...batch,
          errors: allErrors,
          totalCount: rows.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/batches', async (req, res, next) => {
  try {
    const { type, page = 1, pageSize = 50 } = req.query;
    const where = {};
    if (type) where.type = type;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const batches = await prisma.importBatch.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const result = batches.map((batch) => {
      let errors = [];
      if (batch.errors) {
        try { errors = JSON.parse(batch.errors); } catch (e) {}
      }
      return {
        ...batch,
        errors,
      };
    });

    res.json({
      code: 200,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
