import { Router } from 'express'
import prisma from '../prisma.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/:pageKey', authMiddleware, async (req, res) => {
  const { roleDefault } = req.query
  const userFilters = await prisma.savedFilter.findMany({
    where: {
      userId: req.user.id,
      pageKey: req.params.pageKey
    },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
  })

  let roleDefaultFilter = null
  if (roleDefault) {
    roleDefaultFilter = await prisma.savedFilter.findFirst({
      where: {
        pageKey: req.params.pageKey,
        roleDefault: roleDefault
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  res.json({ code: 0, data: { filters: userFilters, roleDefaultFilter } })
})

router.post('/', authMiddleware, async (req, res) => {
  const { pageKey, name, filterData, isDefault, roleDefault } = req.body

  if (isDefault) {
    await prisma.savedFilter.updateMany({
      where: { userId: req.user.id, pageKey, isDefault: true },
      data: { isDefault: false }
    })
  }

  if (roleDefault) {
    await prisma.savedFilter.updateMany({
      where: { pageKey, roleDefault },
      data: { roleDefault: null }
    })
  }

  const filter = await prisma.savedFilter.create({
    data: {
      userId: req.user.id,
      pageKey,
      name,
      filterData,
      isDefault: isDefault || false,
      roleDefault: roleDefault || null
    }
  })
  res.json({ code: 0, data: filter })
})

router.put('/:id', authMiddleware, async (req, res) => {
  const { name, filterData, isDefault, roleDefault } = req.body
  const id = parseInt(req.params.id)

  const existing = await prisma.savedFilter.findUnique({ where: { id } })

  if (isDefault && !existing.isDefault) {
    await prisma.savedFilter.updateMany({
      where: { userId: req.user.id, pageKey: existing.pageKey, isDefault: true },
      data: { isDefault: false }
    })
  }

  if (roleDefault && roleDefault !== existing.roleDefault) {
    await prisma.savedFilter.updateMany({
      where: { pageKey: existing.pageKey, roleDefault },
      data: { roleDefault: null }
    })
  }

  const updateData = { name, filterData, isDefault }
  if (roleDefault !== undefined) {
    updateData.roleDefault = roleDefault || null
  }

  const filter = await prisma.savedFilter.update({
    where: { id },
    data: updateData
  })
  res.json({ code: 0, data: filter })
})

router.delete('/:id', authMiddleware, async (req, res) => {
  await prisma.savedFilter.delete({ where: { id: parseInt(req.params.id) } })
  res.json({ code: 0 })
})

export default router
