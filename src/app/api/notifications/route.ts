import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/notifications'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    const notifications = await getUnreadNotifications(user.id)

    return NextResponse.json({
      success: true,
      data: notifications,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, markAll } = body
    const user = await getCurrentUser()

    if (markAll) {
      const count = await markAllNotificationsAsRead(user.id)
      return NextResponse.json({
        success: true,
        data: { markedCount: count },
      })
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: '通知ID不能为空' },
        { status: 400 }
      )
    }

    const notification = await markNotificationAsRead(id, user.id)

    return NextResponse.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    console.error('Mark notification error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
