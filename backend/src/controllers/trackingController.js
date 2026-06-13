const prisma = require('../utils/prisma')
const { success, error, paginate } = require('../utils/response')

const getPriceTrend = async (req, res) => {
  try {
    const { materialName, supplierId } = req.query
    const where = {}
    if (materialName) where.materialName = materialName
    if (supplierId) where.supplierId = parseInt(supplierId)

    const history = await prisma.priceHistory.findMany({
      where,
      orderBy: { effectiveDate: 'asc' },
      include: { supplier: { select: { name: true } } },
    })

    const trend = history.map(h => ({
      date: h.effectiveDate,
      price: h.price,
      supplier: h.supplier?.name,
      source: h.source,
    }))

    success(res, { trend, materialName })
  } catch (e) {
    error(res, e.message)
  }
}

const getDeliveryConfirmations = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, orderId, status } = req.query
    const where = {}
    if (orderId) where.orderId = parseInt(orderId)

    const [list, total] = await Promise.all([
      prisma.deliveryConfirmation.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { confirmedAt: 'desc' },
        include: {
          order: {
            include: {
              request: { select: { requestNo: true, title: true } },
              supplier: { select: { name: true } },
            },
          },
          confirmer: { select: { realName: true } },
        },
      }),
      prisma.deliveryConfirmation.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

const confirmDelivery = async (req, res) => {
  try {
    const { orderId, deliveryQty, qualityStatus, remark, attachmentUrl } = req.body

    const order = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(orderId) },
    })

    if (!order) {
      return error(res, '采购订单不存在', 404)
    }

    const confirmation = await prisma.deliveryConfirmation.create({
      data: {
        orderId: parseInt(orderId),
        confirmerId: req.user.id,
        deliveryQty: parseFloat(deliveryQty),
        qualityStatus,
        remark,
        attachmentUrl,
      },
    })

    success(res, confirmation, '到货确认成功')
  } catch (e) {
    error(res, e.message)
  }
}

const getOriginalDocuments = async (req, res) => {
  try {
    const { requestId } = req.query
    
    const request = await prisma.purchaseRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        requester: { select: { realName: true, department: true } },
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
            paymentDiff: true,
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

const getPurchaseRequests = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, projectName } = req.query
    const where = {}
    if (keyword) {
      where.OR = [
        { requestNo: { contains: keyword } },
        { title: { contains: keyword } },
      ]
    }
    if (status) where.status = status
    if (projectName) where.projectName = { contains: projectName }

    const [list, total] = await Promise.all([
      prisma.purchaseRequest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { realName: true, department: true } },
          items: true,
          attachments: true,
          approvals: {
            include: { approver: { select: { realName: true } } },
          },
        },
      }),
      prisma.purchaseRequest.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

module.exports = {
  getPriceTrend,
  getDeliveryConfirmations,
  confirmDelivery,
  getOriginalDocuments,
  getPurchaseRequests,
}
