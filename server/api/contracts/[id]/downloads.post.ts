import { prisma } from '../../../utils/db'
import { getUserSession } from '../../../utils/session'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const { id } = getRouterParams(event)
  const body = await readBody(event)
  const { versionId, downloadReason } = body

  const contract = await prisma.contract.findUnique({ where: { id: String(id) } })
  if (!contract) {
    throw createError({ statusCode: 404, message: '合同不存在' })
  }

  const record = await prisma.$transaction(async (tx) => {
    const r = await tx.downloadRecord.create({
      data: {
        contractId: String(id),
        versionId,
        userId: session.user.id,
        downloadReason
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        version: { select: { id: true, versionNo: true, fileName: true } }
      }
    })

    await tx.operationLog.create({
      data: {
        contractId: String(id),
        userId: session.user.id,
        action: 'DOWNLOAD',
        description: `下载合同版本${versionId ? '' : ''}${downloadReason ? `原因: ${downloadReason}` : ''}`
      }
    })

    return r
  })

  return record
})
