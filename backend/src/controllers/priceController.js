const prisma = require('../utils/prisma')
const { success, error, paginate } = require('../utils/response')

const FLUCTUATION_THRESHOLD = 5 // 价格波动阈值（百分比）

const getHistory = async (req, res) => {
  try {
    const { materialName, supplierId, page = 1, pageSize = 10 } = req.query
    const where = {}
    if (materialName) where.materialName = { contains: materialName }
    if (supplierId) where.supplierId = parseInt(supplierId)

    const [list, total] = await Promise.all([
      prisma.priceHistory.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { effectiveDate: 'desc' },
        include: { supplier: { select: { name: true, code: true } } },
      }),
      prisma.priceHistory.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

const addPriceHistory = async (req, res) => {
  try {
    const { supplierId, materialName, specification, price, unit, effectiveDate, source, remark } = req.body
    const history = await prisma.priceHistory.create({
      data: {
        supplierId: parseInt(supplierId),
        materialName,
        specification: specification || '',
        unit,
        price: parseFloat(price),
        effectiveDate: new Date(effectiveDate),
        source,
        remark,
      },
    })
    success(res, history, '添加成功')
  } catch (e) {
    error(res, e.message)
  }
}

const getAlerts = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, isReviewed } = req.query
    const where = {}
    if (isReviewed !== undefined) where.isReviewed = isReviewed === 'true'

    const [list, total] = await Promise.all([
      prisma.priceFluctuationAlert.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          request: { select: { requestNo: true, title: true, projectName: true } },
        },
      }),
      prisma.priceFluctuationAlert.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

const checkPriceFluctuation = async (requestId, items) => {
  const alerts = []
  
  for (const item of items) {
    const latestPrice = await prisma.priceHistory.findFirst({
      where: { materialName: item.materialName },
      orderBy: { effectiveDate: 'desc' },
    })

    if (latestPrice && latestPrice.price > 0) {
      const oldPrice = latestPrice.price.toNumber()
      const newPrice = item.estimatedPrice
      const fluctuation = ((newPrice - oldPrice) / oldPrice) * 100
      
      if (Math.abs(fluctuation) >= FLUCTUATION_THRESHOLD) {
        const alert = await prisma.priceFluctuationAlert.create({
          data: {
            requestId,
            materialName: item.materialName,
            oldPrice: latestPrice.price,
            newPrice,
            fluctuation,
          },
        })
        alerts.push(alert)
      }
    }
  }
  
  return alerts
}

const reviewAlert = async (req, res) => {
  try {
    const { id } = req.params
    const { reviewNote, conclusion, suggestion } = req.body

    const alert = await prisma.priceFluctuationAlert.update({
      where: { id: parseInt(id) },
      data: {
        isReviewed: true,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        reviewNote,
      },
    })

    await prisma.priceReview.create({
      data: {
        alertId: parseInt(id),
        reviewerId: req.user.id,
        conclusion,
        suggestion,
      },
    })

    success(res, alert, '复盘完成')
  } catch (e) {
    error(res, e.message)
  }
}

const getReviews = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, alertId } = req.query
    const where = {}
    if (alertId) where.alertId = parseInt(alertId)

    const [list, total] = await Promise.all([
      prisma.priceReview.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          alert: { select: { materialName: true, fluctuation: true } },
          reviewer: { select: { realName: true } },
        },
      }),
      prisma.priceReview.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

module.exports = {
  getHistory,
  addPriceHistory,
  getAlerts,
  checkPriceFluctuation,
  reviewAlert,
  getReviews,
}
