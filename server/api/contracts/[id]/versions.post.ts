import { prisma, canTransition } from '../../../../utils/db'
import { createHash } from 'crypto'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: '未登录' })
  }

  const { id } = getRouterParams(event)
  const contract = await prisma.contract.findUnique({ where: { id: String(id) } })
  if (!contract) {
    throw createError({ statusCode: 404, message: '合同不存在' })
  }

  const body = await readBody(event)
  const { fileName, fileData, note, mimeType } = body

  if (!fileName || !fileData) {
    throw createError({ statusCode: 400, message: '文件名和文件数据必填' })
  }

  const lastVersion = await prisma.contractVersion.findFirst({
    where: { contractId: String(id) },
    orderBy: { versionNo: 'desc' }
  })

  const versionNo = lastVersion ? lastVersion.versionNo + 1 : 1
  const fileBuffer = Buffer.from(fileData, 'base64')
  const fileHash = createHash('md5').update(fileBuffer).digest('hex')
  const fileSize = fileBuffer.length

  const result = await prisma.$transaction(async (tx) => {
    await tx.contractVersion.updateMany({
      where: { contractId: String(id), isCurrent: true },
      data: { isCurrent: false }
    })

    const version = await tx.contractVersion.create({
      data: {
        contractId: String(id),
        versionNo,
        fileName,
        fileUrl: `/uploads/contracts/${id}/v${versionNo}_${fileName}`,
        fileSize,
        fileHash,
        mimeType,
        note,
        isCurrent: true,
        uploaderId: session.user.id
      },
      include: {
        uploader: { select: { id: true, name: true, role: true } }
      }
    })

    await tx.contract.update({
      where: { id: String(id) },
      data: { currentVersionId: version.id }
    })

    await tx.operationLog.create({
      data: {
        contractId: String(id),
        userId: session.user.id,
        action: 'UPLOAD_VERSION',
        description: `上传第${versionNo}版合同: ${fileName}`
      }
    })

    return version
  })

  return result
})
