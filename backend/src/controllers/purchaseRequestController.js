const prisma = require('../utils/prisma')
const { success, error, paginate } = require('../utils/response')

const generateRequestNo = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `CG${year}${month}${day}${random}`
}

const FLUCTUATION_THRESHOLD = 5

const checkPriceFluctuation = async (requestId, items) => {
  const alerts = []
  for (const item of items) {
    const latestPrice = await prisma.priceHistory.findFirst({
      where: { materialName: item.materialName },
      orderBy: { effectiveDate: 'desc' },
    })
    if (latestPrice && latestPrice.price > 0) {
      const oldPrice = parseFloat(latestPrice.price)
      const newPrice = parseFloat(item.estimatedPrice || item.estimatedPrice)
      const fluctuation = ((newPrice - oldPrice) / oldPrice) * 100
      if (Math.abs(fluctuation) >= FLUCTUATION_THRESHOLD) {
        const alert = await prisma.priceFluctuationAlert.create({
          data: {
            requestId,
            materialName: item.materialName,
            oldPrice: latestPrice.price,
            newPrice,
            fluctuation: parseFloat(fluctuation.toFixed(2)),
          },
        })
        alerts.push(alert)
      }
    }
  }
  return alerts
}

const getList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, keyword, department } = req.query
    const where = {}
    
    if (status) where.status = status
    if (department) where.department = department
    if (keyword) {
      where.OR = [
        { requestNo: { contains: keyword } },
        { title: { contains: keyword } },
        { projectName: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { realName: true, department: true } },
          items: true,
        },
      }),
      prisma.purchaseRequest.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

const getDetail = async (req, res) => {
  try {
    const { id } = req.params
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: parseInt(id) },
      include: {
        requester: { select: { realName: true, department: true, username: true } },
        items: true,
        attachments: true,
        approvals: {
          include: { approver: { select: { realName: true, role: true } } },
          orderBy: { level: 'asc' },
        },
        priceAlerts: true,
        purchaseOrder: {
          include: {
            supplier: true,
            delivery: true,
          },
        },
      },
    })

    if (!request) {
      return error(res, '采购需求不存在', 404)
    }

    success(res, request)
  } catch (e) {
    error(res, e.message)
  }
}

const create = async (req, res) => {
  try {
    const { title, projectName, department, items, remark, deliveryDate, status = 'draft', tempKey } = req.body
    const requestNo = generateRequestNo()

    const parsedItems = JSON.parse(items || '[]')
    let totalAmount = 0
    const itemData = parsedItems.map(item => {
      const amount = parseFloat(item.quantity) * parseFloat(item.estimatedPrice)
      totalAmount += amount
      return {
        materialName: item.materialName,
        specification: item.specification || '',
        unit: item.unit,
        quantity: item.quantity,
        estimatedPrice: item.estimatedPrice,
        totalAmount: amount,
        remark: item.remark,
      }
    })

    const request = await prisma.purchaseRequest.create({
      data: {
        requestNo,
        title,
        projectName,
        department,
        requesterId: req.user.id,
        status,
        totalAmount,
        remark,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        items: { create: itemData },
      },
      include: { items: true },
    })

    if (tempKey) {
      await prisma.attachment.updateMany({
        where: { tempKey, requestId: null },
        data: { requestId: request.id, tempKey: null },
      })
    }

    if (status === 'pending') {
      await createApprovalRecords(request.id, totalAmount)
      await checkPriceFluctuation(request.id, parsedItems)
    }

    success(res, request, '创建成功')
  } catch (e) {
    error(res, e.message)
  }
}

const createApprovalRecords = async (requestId, totalAmount) => {
  const levels = await prisma.approvalLevel.findMany({
    where: {
      enabled: true,
      minAmount: { lte: totalAmount },
      maxAmount: { gte: totalAmount },
    },
    orderBy: { level: 'asc' },
  })

  if (levels.length > 0) {
    const firstLevel = levels[0]
    await prisma.approvalRecord.create({
      data: {
        requestId,
        level: firstLevel.level,
        status: 'pending',
      },
    })
  }
}

const update = async (req, res) => {
  try {
    const { id } = req.params
    const { title, projectName, department, items, remark, deliveryDate, status } = req.body

    const existing = await prisma.purchaseRequest.findUnique({ where: { id: parseInt(id) } })
    if (!existing) {
      return error(res, '采购需求不存在', 404)
    }

    if (existing.status !== 'draft') {
      return error(res, '只能编辑草稿状态的需求', 400)
    }

    let totalAmount = existing.totalAmount
    let parsedItems = null
    let updateData = {
      title: title || existing.title,
      projectName: projectName || existing.projectName,
      department: department || existing.department,
      remark: remark !== undefined ? remark : existing.remark,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : existing.deliveryDate,
      status: status || existing.status,
    }

    if (items) {
      parsedItems = JSON.parse(items)
      const itemData = parsedItems.map(item => ({
        materialName: item.materialName,
        specification: item.specification || '',
        unit: item.unit,
        quantity: item.quantity,
        estimatedPrice: item.estimatedPrice,
        totalAmount: parseFloat(item.quantity) * parseFloat(item.estimatedPrice),
        remark: item.remark,
      }))
      totalAmount = itemData.reduce((sum, item) => sum + item.totalAmount, 0)
      updateData.totalAmount = totalAmount

      await prisma.purchaseItem.deleteMany({ where: { requestId: parseInt(id) } })
      updateData.items = { create: itemData }
    }

    const request = await prisma.purchaseRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { items: true },
    })

    if (status === 'pending' && existing.status === 'draft') {
      await createApprovalRecords(parseInt(id), totalAmount)
      const itemsForCheck = parsedItems || request.items
      await checkPriceFluctuation(parseInt(id), itemsForCheck)
    }

    success(res, request, '更新成功')
  } catch (e) {
    error(res, e.message)
  }
}

const submit = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await prisma.purchaseRequest.findUnique({
      where: { id: parseInt(id) },
      include: { items: true },
    })
    if (!existing) {
      return error(res, '采购需求不存在', 404)
    }

    if (existing.status !== 'draft') {
      return error(res, '只能提交草稿状态的需求', 400)
    }

    const totalAmount = parseFloat(existing.totalAmount)

    await prisma.purchaseRequest.update({
      where: { id: parseInt(id) },
      data: { status: 'pending', currentLevel: 1 },
    })

    await createApprovalRecords(parseInt(id), totalAmount)
    await checkPriceFluctuation(parseInt(id), existing.items)

    success(res, { id: parseInt(id) }, '提交成功，价格波动检测已完成')
  } catch (e) {
    error(res, e.message)
  }
}

const uploadAttachment = async (req, res) => {
  try {
    const { requestId, tempKey } = req.body
    const file = req.file

    if (!file) {
      return error(res, '请上传文件', 400)
    }

    if (!requestId && !tempKey) {
      return error(res, 'requestId 或 tempKey 至少传一个', 400)
    }

    const data = {
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      fileUrl: `/uploads/${file.filename}`,
      uploadedBy: req.user.id,
    }
    if (requestId && parseInt(requestId) > 0) {
      data.requestId = parseInt(requestId)
    }
    if (tempKey) {
      data.tempKey = tempKey
    }

    const attachment = await prisma.attachment.create({ data })

    success(res, attachment, '上传成功')
  } catch (e) {
    error(res, e.message)
  }
}

const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.attachment.delete({ where: { id: parseInt(id) } })
    success(res, null, '删除成功')
  } catch (e) {
    error(res, e.message)
  }
}

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params
    
    const existing = await prisma.purchaseRequest.findUnique({ where: { id: parseInt(id) } })
    if (!existing) {
      return error(res, '采购需求不存在', 404)
    }

    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      return error(res, '只能删除草稿或已驳回的需求', 400)
    }

    await prisma.purchaseRequest.delete({ where: { id: parseInt(id) } })
    success(res, null, '删除成功')
  } catch (e) {
    error(res, e.message)
  }
}

module.exports = {
  getList,
  getDetail,
  create,
  update,
  submit,
  uploadAttachment,
  deleteAttachment,
  deleteRequest,
  createApprovalRecords,
}
