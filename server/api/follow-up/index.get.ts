import { requireAuth } from '~/server/utils/auth'
import { prisma } from '~/server/utils/prisma'
import { successResponse } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const patientId = query.patientId ? parseInt(query.patientId as string) : undefined
  const courseId = query.courseId ? parseInt(query.courseId as string) : undefined
  const status = query.status as string
  const type = query.type as string
  const assignedTo = query.assignedTo ? parseInt(query.assignedTo as string) : undefined
  const startDate = query.startDate as string
  const endDate = query.endDate as string

  const where: any = {}
  if (patientId) where.patientId = patientId
  if (courseId) where.courseId = courseId
  if (status) where.status = status
  if (type) where.type = type
  if (assignedTo) where.assignedTo = assignedTo
  if (startDate && endDate) {
    where.scheduledDate = {
      gte: new Date(startDate),
      lte: new Date(endDate)
    }
  }

  const [tasks, total] = await Promise.all([
    prisma.followUpTask.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [
        { priority: 'desc' },
        { scheduledDate: 'asc' }
      ],
      include: {
        patient: {
          select: {
            id: true,
            patientNo: true,
            name: true,
            phone: true
          }
        },
        course: {
          select: {
            id: true,
            courseNo: true,
            name: true,
            status: true
          }
        },
        assignee: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            followUpRecords: true
          }
        }
      }
    }),
    prisma.followUpTask.count({ where })
  ])

  return successResponse(tasks, '获取成功', total)
})
