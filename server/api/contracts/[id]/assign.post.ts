import { prisma, canTransition } from '../../../utils/db'
import { getUserSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const { id } = getRouterParams(event)
  const body = await readBody(event)
  const {
    lawyerId, reviewerId,
    lawyerDeadline, reviewerDeadline,
    note
  } = body

  const contract = await prisma.contract.findUnique({ where: { id: String(id) } })
  if (!contract) {
    throw createError({ statusCode: 404, message: '合同不存在' })
  }

  const result = await prisma.$transaction(async (tx) => {
    let newStatus = contract.status

    if (lawyerId) {
      const lawyer = await tx.user.findUnique({ where: { id: lawyerId } })
      if (!lawyer || (lawyer.role !== 'LAWYER' && lawyer.role !== 'LEGAL_MANAGER' && lawyer.role !== 'ADMIN')) {
        throw createError({ statusCode: 400, message: '分派的用户角色无效（需律师或管理员）' })
      }

      if (contract.status === 'NEW' || contract.status === 'RECTIFYING') {
        newStatus = 'ASSIGNED_LAWYER'
      }

      const existingAssignment = await tx.assignment.findFirst({
        where: { contractId: String(id) },
        orderBy: { createdAt: 'desc' }
      })

      let assignment
      if (existingAssignment) {
        assignment = await tx.assignment.update({
          where: { id: existingAssignment.id },
          data: {
            lawyerId,
            lawyerAssignedAt: new Date(),
            lawyerDeadline: lawyerDeadline ? new Date(lawyerDeadline) : null,
            reviewerId: reviewerId || existingAssignment.reviewerId,
            reviewerDeadline: reviewerDeadline ? new Date(reviewerDeadline) : existingAssignment.reviewerDeadline,
            note: note || existingAssignment.note
          },
          include: {
            lawyer: { select: { id: true, name: true, role: true } },
            reviewer: { select: { id: true, name: true, role: true } }
          }
        })
      } else {
        assignment = await tx.assignment.create({
          data: {
            contractId: String(id),
            lawyerId,
            lawyerDeadline: lawyerDeadline ? new Date(lawyerDeadline) : null,
            reviewerId,
            reviewerDeadline: reviewerDeadline ? new Date(reviewerDeadline) : null,
            note
          },
          include: {
            lawyer: { select: { id: true, name: true, role: true } },
            reviewer: { select: { id: true, name: true, role: true } }
          }
        })
      }

      await tx.operationLog.create({
        data: {
          contractId: String(id),
          userId: session.user.id,
          action: 'ASSIGN_LAWYER',
          description: `分派律师: ${lawyer.name}${lawyerDeadline ? ` (截止: ${lawyerDeadline})` : ''}`,
          toStatus: newStatus
        }
      })

      if (lawyerDeadline) {
        await tx.reminder.upsert({
          where: {
            contractId_userId_reminderType: {
              contractId: String(id),
              userId: lawyerId,
              reminderType: 'LAWYER_DEADLINE'
            }
          },
          update: {
            title: '律师审阅期限提醒',
            message: `您负责的合同《${contract.title}》审阅期限临近，请及时处理`,
            deadlineDate: new Date(lawyerDeadline),
            daysBefore: 3,
            status: 'PENDING'
          },
          create: {
            contractId: String(id),
            userId: lawyerId,
            reminderType: 'LAWYER_DEADLINE',
            title: '律师审阅期限提醒',
            message: `您负责的合同《${contract.title}》审阅期限临近，请及时处理`,
            deadlineDate: new Date(lawyerDeadline),
            daysBefore: 3
          }
        })
      }

      if (reviewerId) {
        if (contract.status === 'LAWYER_COMPLETED') {
          newStatus = 'ASSIGNED_REVIEWER'
        }
        const reviewer = await tx.user.findUnique({ where: { id: reviewerId } })
        if (reviewer) {
          await tx.operationLog.create({
            data: {
              contractId: String(id),
              userId: session.user.id,
              action: 'ASSIGN_REVIEWER',
              description: `分派复核人: ${reviewer.name}${reviewerDeadline ? ` (截止: ${reviewerDeadline})` : ''}`,
              toStatus: newStatus
            }
          })

          if (reviewerDeadline) {
            await tx.reminder.upsert({
              where: {
                contractId_userId_reminderType: {
                  contractId: String(id),
                  userId: reviewerId,
                  reminderType: 'REVIEWER_DEADLINE'
                }
              },
              update: {
                title: '复核期限提醒',
                message: `您负责复核的合同《${contract.title}》复核期限临近，请及时处理`,
                deadlineDate: new Date(reviewerDeadline),
                daysBefore: 2,
                status: 'PENDING'
              },
              create: {
                contractId: String(id),
                userId: reviewerId,
                reminderType: 'REVIEWER_DEADLINE',
                title: '复核期限提醒',
                message: `您负责复核的合同《${contract.title}》复核期限临近，请及时处理`,
                deadlineDate: new Date(reviewerDeadline),
                daysBefore: 2
              }
            })
          }
        }
      }

      if (newStatus !== contract.status && canTransition(contract.status, newStatus)) {
        await tx.contract.update({
          where: { id: String(id) },
          data: { status: newStatus }
        })
      }

      return { contract, assignment }
    }

    if (reviewerId) {
      const reviewer = await tx.user.findUnique({ where: { id: reviewerId } })
      if (!reviewer || (reviewer.role !== 'REVIEWER' && reviewer.role !== 'LEGAL_MANAGER' && reviewer.role !== 'ADMIN')) {
        throw createError({ statusCode: 400, message: '分派的复核人角色无效' })
      }

      if (contract.status === 'LAWYER_COMPLETED' || contract.status === 'RECTIFYING') {
        newStatus = 'ASSIGNED_REVIEWER'
      }

      const existingAssignment = await tx.assignment.findFirst({
        where: { contractId: String(id) },
        orderBy: { createdAt: 'desc' }
      })

      let assignment
      if (existingAssignment) {
        assignment = await tx.assignment.update({
          where: { id: existingAssignment.id },
          data: {
            reviewerId,
            reviewerAssignedAt: new Date(),
            reviewerDeadline: reviewerDeadline ? new Date(reviewerDeadline) : null,
            note: note || existingAssignment.note
          },
          include: {
            lawyer: { select: { id: true, name: true, role: true } },
            reviewer: { select: { id: true, name: true, role: true } }
          }
        })
      }

      await tx.operationLog.create({
        data: {
          contractId: String(id),
          userId: session.user.id,
          action: 'ASSIGN_REVIEWER',
          description: `分派复核人: ${reviewer.name}${reviewerDeadline ? ` (截止: ${reviewerDeadline})` : ''}`,
          toStatus: newStatus
        }
      })

      if (reviewerDeadline) {
        await tx.reminder.upsert({
          where: {
            contractId_userId_reminderType: {
              contractId: String(id),
              userId: reviewerId,
              reminderType: 'REVIEWER_DEADLINE'
            }
          },
          update: {
            title: '复核期限提醒',
            message: `您负责复核的合同《${contract.title}》复核期限临近，请及时处理`,
            deadlineDate: new Date(reviewerDeadline),
            daysBefore: 2,
            status: 'PENDING'
          },
          create: {
            contractId: String(id),
            userId: reviewerId,
            reminderType: 'REVIEWER_DEADLINE',
            title: '复核期限提醒',
            message: `您负责复核的合同《${contract.title}》复核期限临近，请及时处理`,
            deadlineDate: new Date(reviewerDeadline),
            daysBefore: 2
          }
        })
      }

      if (newStatus !== contract.status && canTransition(contract.status, newStatus)) {
        await tx.contract.update({
          where: { id: String(id) },
          data: { status: newStatus }
        })
      }

      return { contract, assignment }
    }

    throw createError({ statusCode: 400, message: '请指定律师或复核人' })
  })

  return result
})
