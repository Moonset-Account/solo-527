import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const createCoverSchema = z.object({
  version: z.string().default('1.0'),
  imageUrl: z.string().url('图片地址无效'),
  description: z.string().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth(request.headers)
    const body = await request.json()
    const data = createCoverSchema.parse(body)

    const coverVersion = await prisma.coverVersion.create({
      data: {
        ...data,
        scriptId: id,
      },
    })

    return NextResponse.json({ success: true, data: coverVersion })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
