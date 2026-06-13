const prisma = require('../utils/prisma')
const { success, error, paginate } = require('../utils/response')

const getSuppliers = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, riskLevel } = req.query
    const where = {}
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { contact: { contains: keyword } },
      ]
    }
    if (riskLevel) where.riskLevel = parseInt(riskLevel)

    const [list, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: parseInt(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ])

    paginate(res, list, total, page, pageSize)
  } catch (e) {
    error(res, e.message)
  }
}

const getSupplier = async (req, res) => {
  try {
    const { id } = req.params
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: {
        supplierRiskLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10 },
        priceHistory: { orderBy: { effectiveDate: 'desc' }, take: 20 },
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

const createSupplier = async (req, res) => {
  try {
    const { name, code, contact, phone, address, bankAccount, taxNumber } = req.body
    
    const existing = await prisma.supplier.findUnique({ where: { code } })
    if (existing) {
      return error(res, '供应商编码已存在', 400)
    }

    const supplier = await prisma.supplier.create({
      data: { name, code, contact, phone, address, bankAccount, taxNumber },
    })
    
    success(res, supplier, '创建成功')
  } catch (e) {
    error(res, e.message)
  }
}

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params
    const { name, contact, phone, address, bankAccount, taxNumber, riskLevel, riskNote } = req.body
    
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: { name, contact, phone, address, bankAccount, taxNumber, riskLevel, riskNote },
    })
    
    success(res, supplier, '更新成功')
  } catch (e) {
    error(res, e.message)
  }
}

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.supplier.delete({ where: { id: parseInt(id) } })
    success(res, null, '删除成功')
  } catch (e) {
    error(res, e.message)
  }
}

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
}
