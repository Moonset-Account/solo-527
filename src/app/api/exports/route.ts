import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { addExportJob, initWorker } from '@/lib/queue'
import { z } from 'zod'
import { ExportFormat } from '@prisma/client'

const createExportSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  description: z.string().optional(),
  format: z.enum(['CSV', 'EXCEL', 'PDF']).default('CSV'),
  filters: z.any().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request.headers)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const status = searchParams.get('status')

    const where: any = { userId: user.id }
    if (status) where.status = status

    const [tasks, total] = await Promise.all([
      prisma.exportTask.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.exportTask.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: tasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    initWorker()
    const user = await requireAuth(request.headers)
    const body = await request.json()
    const data = createExportSchema.parse(body)

    const exportTask = await prisma.exportTask.create({
      data: {
        name: data.name,
        description: data.description,
        format: data.format as ExportFormat,
        filters: data.filters,
        userId: user.id,
      },
    })

    await addExportJob(exportTask.id, data.filters, data.format)

    return NextResponse.json({ success: true, data: exportTask })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
