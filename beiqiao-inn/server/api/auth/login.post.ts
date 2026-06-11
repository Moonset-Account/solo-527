import { createHash } from 'crypto'
import { prisma } from '~/server/utils/prisma'
import { useMockStore, isDbAvailable } from '~/server/utils/mockData'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { phone, password } = body

  if (!phone || !password) {
    throw createError({ statusCode: 400, statusMessage: 'phone and password are required' })
  }

  if (!(await isDbAvailable())) {
    const store = useMockStore()
    if (phone === '13800000001') {
      return { id: 1, name: '管理员', role: 'ADMIN', phone: '13800000001', token: 'mock-token-' + Date.now() }
    }
    throw createError({ statusCode: 401, statusMessage: 'invalid phone or password' })
  }

  const user = await prisma.user.findUnique({ where: { phone } })

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'invalid phone or password' })
  }

  const hashed = createHash('sha256').update(password).digest('hex')
  if (user.password !== hashed) {
    throw createError({ statusCode: 401, statusMessage: 'invalid phone or password' })
  }

  const token = createHash('sha256').update(`${user.id}-${Date.now()}`).digest('hex')

  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    token,
  }
})
