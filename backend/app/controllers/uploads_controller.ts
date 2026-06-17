import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'
import env from '#start/env'
import { randomUUID } from 'crypto'
import path from 'node:path'

export default class UploadsController {
  async uploadImage({ request, response, auth }: HttpContext) {
    const user = auth.user!

    const file = request.file('image', {
      size: env.get('UPLOAD_MAX_SIZE', '10mb'),
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    })

    if (!file) {
      return response.status(400).json({ message: '请选择要上传的图片' })
    }

    if (!file.isValid) {
      return response
        .status(400)
        .json({ message: file.errors[0]?.message || '图片格式或大小不符合要求' })
    }

    const ext = path.extname(file.clientName) || '.jpg'
    const fileName = `${Date.now()}_${randomUUID().slice(0, 8)}${ext}`
    const dirPath = `uploads/${user.id}`
    const filePath = `${dirPath}/${fileName}`

    await file.moveToDisk(dirPath, {
      name: fileName,
    })

    const url = await drive.use().getUrl(filePath)

    return response.json({
      message: '上传成功',
      data: {
        url,
        path: filePath,
        name: file.clientName,
        size: file.size,
      },
    })
  }

  async uploadMultiple({ request, response, auth }: HttpContext) {
    const user = auth.user!

    const maxFiles = parseInt(env.get('UPLOAD_MAX_FILES', '5'), 10)
    const files = request.files('images', {
      size: env.get('UPLOAD_MAX_SIZE', '10mb'),
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    })

    if (!files || files.length === 0) {
      return response.status(400).json({ message: '请选择要上传的图片' })
    }

    if (files.length > maxFiles) {
      return response
        .status(400)
        .json({ message: `最多只能上传 ${maxFiles} 张图片` })
    }

    const results = []

    for (const file of files) {
      if (!file.isValid) {
        continue
      }

      const ext = path.extname(file.clientName) || '.jpg'
      const fileName = `${Date.now()}_${randomUUID().slice(0, 8)}${ext}`
      const dirPath = `uploads/${user.id}`
      const filePath = `${dirPath}/${fileName}`

      await file.moveToDisk(dirPath, {
        name: fileName,
      })

      const url = await drive.use().getUrl(filePath)

      results.push({
        url,
        path: filePath,
        name: file.clientName,
        size: file.size,
      })
    }

    return response.json({
      message: `成功上传 ${results.length} 张图片`,
      data: results,
    })
  }
}
