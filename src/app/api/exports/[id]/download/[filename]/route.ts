import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(_request.headers)

    const task = await prisma.exportTask.findUnique({
      where: { id, userId: user.id },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, error: '导出任务不存在' },
        { status: 404 }
      )
    }

    if (!task.fileContent) {
      return NextResponse.json(
        { success: false, error: '文件内容不存在或尚未生成' },
        { status: 404 }
      )
    }

    const downloadName = task.fileName || 'export.csv'
    const mime = task.mimeType || 'application/octet-stream'

    return new NextResponse(task.fileContent, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
        'Content-Length': String(Buffer.byteLength(task.fileContent, 'utf8')),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
