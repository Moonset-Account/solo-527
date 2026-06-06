import { NextResponse } from 'next/server'
import { processNotificationQueue } from '@/lib/notification-service'

export async function POST() {
  try {
    const result = await processNotificationQueue()
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
