const prisma = require('../utils/prisma')
const { success, error, paginate } = require('../utils/response')

const getPaymentAlerts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    const where = {}
    if (status) where.status = status

    const [list, total] = await Promise.all([
      prisma.paymentDifferenceAlert.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              supplier: { select: { name: true, code: true } },
              request: { select: { requestNo: true, title: true } },
            },
          },
        },
      }),
      prisma.paymentDifferenceAlert.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

const createPaymentAlert = async (req, res) => {
  try {
    const { orderId, orderAmount, actualPayment, handleNote } = req.body
    
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(orderId) },
    })
    if (!order) {
      return error(res, '采购订单不存在', 404)
    }

    const difference = parseFloat(actualPayment) - parseFloat(orderAmount)
    const diffPercent = (difference / parseFloat(orderAmount)) * 100

    const alert = await prisma.paymentDifferenceAlert.create({
      data: {
        orderId: parseInt(orderId),
        orderAmount: parseFloat(orderAmount),
        actualPayment: parseFloat(actualPayment),
        difference,
        diffPercent,
        status: 'pending',
      },
    })

    success(res, alert, '付款差异提醒已创建')
  } catch (e) {
    error(res, e.message)
  }
}

const resolvePaymentAlert = async (req, res) => {
  try {
    const { id } = req.params
    const { handleNote } = req.body

    const alert = await prisma.paymentDifferenceAlert.findUnique({
      where: { id: parseInt(id) },
      include: { order: { include: { supplier: true } } },
    })

    if (!alert) {
      return error(res, '付款差异提醒不存在', 404)
    }

    if (alert.status === 'resolved') {
      return error(res, '该提醒已处理', 400)
    }

    await prisma.paymentDifferenceAlert.update({
      where: { id: parseInt(id) },
      data: {
        status: 'resolved',
        handlerId: req.user.id,
        handledAt: new Date(),
        handleNote,
      },
    })

    const severity = Math.abs(alert.diffPercent) > 20 ? 5 : Math.abs(alert.diffPercent) > 10 ? 3 : 2
    
    await prisma.supplierRiskLog.create({
      data: {
        supplierId: alert.order.supplierId,
        riskType: 'payment_diff',
        severity,
        description: `付款差异 ${alert.difference} 元，差异率 ${alert.diffPercent}%`,
        source: 'payment_diff_alert',
      },
    })

    const supplier = await prisma.supplier.findUnique({
      where: { id: alert.order.supplierId },
      include: { _count: { select: { supplierRiskLogs: true } } },
    })

    const avgSeverity = supplier._count.supplierRiskLogs > 0
      ? Math.min(5, Math.max(1, Math.round(severity / 2 + supplier.riskLevel / 2)))
      : severity

    await prisma.supplier.update({
      where: { id: alert.order.supplierId },
      data: { riskLevel: avgSeverity },
    })

    success(res, null, '处理完成，已更新供应商风险')
  } catch (e) {
    error(res, e.message)
  }
}

const getSupplierRiskBoard = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, riskLevel, keyword } = req.query
    const where = {}
    if (riskLevel) where.riskLevel = parseInt(riskLevel)
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
      ]
    }

    const [list, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { riskLevel: 'desc' },
        include: {
          _count: { select: { supplierRiskLogs: true, purchaseOrders: true } },
        },
      }),
      prisma.supplier.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

const getSupplierRiskDetail = async (req, res) => {
  try {
    const { id } = req.params
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplierRiskLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { request: { select: { requestNo: true, title: true } } },
        },
      },
    })

    if (!supplier) {
      return error(res, '供应商不存在', 404)
    }

    success(res, supplier)
  } catch (e) {
    error(res, e.message)
  }
}

module.exports = {
  getPaymentAlerts,
  createPaymentAlert,
  resolvePaymentAlert,
  getSupplierRiskBoard,
  getSupplierRiskDetail,
}
