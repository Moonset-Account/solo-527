import { HttpContext } from '@adonisjs/core/http'
import Attachment from '#models/attachment'
import drive from '@adonisjs/drive/services/main'
import app from '@adonisjs/core/services/app'

export default class AttachmentsController {
  public async index({ request, response }: HttpContext) {
    const attachableType = request.input('attachable_type')
    const attachableId = request.input('attachable_id')

    if (!attachableType || !attachableId) {
      return response.badRequest({ message: 'attachable_type 和 attachable_id 为必填项' })
    }

    const attachments = await Attachment.query()
      .where('attachableType', attachableType)
      .where('attachableId', attachableId)
      .orderBy('createdAt', 'desc')

    return response.ok(attachments)
  }

  public async store({ request, response, auth }: HttpContext) {
    const attachableType = request.input('attachable_type')
    const attachableId = request.input('attachable_id')
    const file = request.file('file', {
      size: '10mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
    })

    if (!file) {
      return response.badRequest({ message: '请上传文件' })
    }

    if (!attachableType || !attachableId) {
      return response.badRequest({ message: 'attachable_type 和 attachable_id 为必填项' })
    }

    await file.moveToDisk(app.makePath('uploads'), { name: `${Date.now()}_${file.clientName}` })

    const attachment = await Attachment.create({
      attachableType,
      attachableId: Number(attachableId),
      fileName: file.clientName,
      fileType: file.extname || 'unknown',
      fileSize: file.size,
      disk: 'local',
      path: file.filePath || '',
      uploadedBy: auth.user!.id,
    })

    return response.created(attachment)
  }

  public async destroy({ params, response }: HttpContext) {
    const attachment = await Attachment.findOrFail(params.id)

    const disk = drive.use(attachment.disk)
    try {
      await disk.delete(attachment.path)
    } catch {}

    await attachment.delete()
    return response.noContent()
  }
}
