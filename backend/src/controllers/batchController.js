const prisma = require('../utils/prisma')
const { success, error, paginate } = require('../utils/response')

const generateBatchNo = () => {
  const date = new Date()
  return `BATCH${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`
}

const validateRecord = (record, fields) => {
  const errors = {}
  
  for (const field of fields) {
    if (field.required && (record[field.name] === undefined || record[field.name] === '' || record[field.name] === null)) {
      errors[field.name] = `${field.label}不能为空`
    }
    
    if (record[field.name] !== undefined && record[field.name] !== null && record[field.name] !== '') {
      if (field.type === 'number' && isNaN(parseFloat(record[field.name]))) {
        errors[field.name] = `${field.label}必须是数字`
      }
      if (field.type === 'date' && isNaN(new Date(record[field.name]).getTime())) {
        errors[field.name] = `${field.label}日期格式不正确`
      }
      if (field.max && parseFloat(record[field.name]) > field.max) {
        errors[field.name] = `${field.label}不能超过${field.max}`
      }
      if (field.min && parseFloat(record[field.name]) < field.min) {
        errors[field.name] = `${field.label}不能小于${field.min}`
      }
    }
  }
  
  return errors
}

const getBatchLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, operation } = req.query
    const where = {}
    if (operation) where.operation = operation

    const [list, total] = await Promise.all([
      prisma.batchUpdateLog.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.batchUpdateLog.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

const getBatchDetail = async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, pageSize = 20, success } = req.query
    const where = { logId: parseInt(id) }
    if (success !== undefined) where.success = success === 'true'

    const [log, details, total] = await Promise.all([
      prisma.batchUpdateLog.findUnique({ where: { id: parseInt(id) } }),
      prisma.batchUpdateDetail.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { id: 'asc' },
      }),
      prisma.batchUpdateDetail.count({ where }),
    ])

    success(res, { log, details, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (e) {
    error(res, e.message)
  }
}

const previewUpdate = async (req, res) => {
  try {
    const { ids, data, entityType } = req.body
    
    if (!ids || ids.length === 0) {
      return error(res, '请选择要更新的记录', 400)
    }

    let records = []
    let entityModel

    switch (entityType) {
      case 'purchaseRequest':
        entityModel = prisma.purchaseRequest
        records = await prisma.purchaseRequest.findMany({
          where: { id: { in: ids.map(id => parseInt(id)) } },
          select: { id: true, requestNo: true, title: true, status: true, totalAmount: true },
        })
        break
      case 'supplier':
        entityModel = prisma.supplier
        records = await prisma.supplier.findMany({
          where: { id: { in: ids.map(id => parseInt(id)) } },
          select: { id: true, name: true, code: true, riskLevel: true },
        })
        break
      default:
        return error(res, '不支持的实体类型', 400)
    }

    const fieldInfo = Object.keys(data).map(key => ({
      field: key,
      newValue: data[key],
    }))

    success(res, {
      count: records.length,
      records,
      fieldInfo,
      scopeNote: `将更新 ${records.length} 条记录的 ${fieldInfo.length} 个字段`,
    })
  } catch (e) {
    error(res, e.message)
  }
}

const batchUpdate = async (req, res) => {
  try {
    const { ids, data, entityType, fields, scopeNote } = req.body
    
    if (!ids || ids.length === 0) {
      return error(res, '请选择要更新的记录', 400)
    }

    const batchNo = generateBatchNo()
    const successIds = []
    const failRecords = []

    const batchLog = await prisma.batchUpdateLog.create({
      data: {
        batchNo,
        operatorId: req.user.id,
        operation: `批量更新${entityType}`,
        totalCount: ids.length,
        successCount: 0,
        failCount: 0,
        scopeNote: scopeNote || `批量更新 ${ids.length} 条记录`,
      },
    })

    for (const id of ids) {
      try {
        if (fields && fields.length > 0) {
          const errors = validateRecord(data, fields)
          if (Object.keys(errors).length > 0) {
            failRecords.push({
              logId: batchLog.id,
              recordId: parseInt(id),
              success: false,
              errorFields: errors,
              errorMessage: '字段验证失败',
              data,
            })
            continue
          }
        }

        let result
        switch (entityType) {
          case 'purchaseRequest':
            result = await prisma.purchaseRequest.update({
              where: { id: parseInt(id) },
              data,
            })
            break
          case 'supplier':
            result = await prisma.supplier.update({
              where: { id: parseInt(id) },
              data,
            })
            break
          default:
            throw new Error('不支持的实体类型')
        }

        successIds.push(id)
        await prisma.batchUpdateDetail.create({
          data: {
            logId: batchLog.id,
            recordId: parseInt(id),
            success: true,
            data,
          },
        })
      } catch (e) {
        failRecords.push({
          logId: batchLog.id,
          recordId: parseInt(id),
          success: false,
          errorMessage: e.message,
          data,
        })
      }
    }

    for (const fail of failRecords) {
      await prisma.batchUpdateDetail.create({ data: fail })
    }

    await prisma.batchUpdateLog.update({
      where: { id: batchLog.id },
      data: {
        successCount: successIds.length,
        failCount: failRecords.length,
      },
    })

    success(res, {
      batchNo,
      totalCount: ids.length,
      successCount: successIds.length,
      failCount: failRecords.length,
      failRecords,
    }, '批量更新完成')
  } catch (e) {
    error(res, e.message)
  }
}

module.exports = {
  getBatchLogs,
  getBatchDetail,
  previewUpdate,
  batchUpdate,
}
