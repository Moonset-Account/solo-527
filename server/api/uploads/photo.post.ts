import { writeFile } from 'fs/promises'
import path from 'path'
import { requireAuth } from '~/server/utils/auth'

export default requireAuth(async (event) => {
  const formData = await readFormData(event)
  const file = formData.get('file') as File
  
  if (!file) {
    throw createError({
      statusCode: 400,
      message: '请选择文件'
    })
  }
  
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${file.name}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  const filepath = path.join(uploadDir, filename)
  
  await writeFile(filepath, buffer)
  
  const url = `/uploads/${filename}`
  
  return {
    url,
    name: file.name,
    size: file.size
  }
})
