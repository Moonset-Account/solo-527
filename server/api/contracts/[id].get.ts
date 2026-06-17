import { prisma } from '../../utils/db'
import { getUserSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const { id } = getRouterParams(event)

  const contract = await prisma.contract.findUnique({
    where: { id: String(id) },
    include: {
      creator: { select: { id: true, name: true, role: true, department: true, email: true, phone: true } },
      versions: {
        include: {
          uploader: { select: { id: true, name: true, role: true } }
        },
        orderBy: { versionNo: 'desc' }
      },
      assignments: {
        include: {
          lawyer: { select: { id: true, name: true, role: true, department: true, email: true, phone: true } },
          reviewer: { select: { id: true, name: true, role: true, department: true, email: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      opinions: {
        include: {
          author: { select: { id: true, name: true, role: true, avatar: true } },
          version: { select: { id: true, versionNo: true, fileName: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      downloads: {
        include: {
          user: { select: { id: true, name: true, role: true } },
          version: { select: { id: true, versionNo: true, fileName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      reminders: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      complianceGaps: {
        include: {
          reporter: { select: { id: true, name: true } },
          resolver: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { versions: true, opinions: true, downloads: true, complianceGaps: true }
      }
    }
  })

  if (!contract) {
    throw createError({ statusCode: 404, message: '合同不存在' })
  }

  const logs = await prisma.operationLog.findMany({
    where: { contractId: String(id) },
    include: {
      user: { select: { id: true, name: true, role: true, avatar: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return { ...contract, logs }
})
