import { NextRequest } from 'next/server'
import { BookingService } from '@/lib/services/bookingService'
import { NotificationService } from '@/lib/services/notificationService'
import { successResponse, handleApiError } from '@/lib/api/response'
import { requireStaff } from '@/lib/api/handler'

export async function GET(request: NextRequest) {
  try {
    await requireStaff()
    const bookingService = new BookingService()
    const reminders = await bookingService.getPaymentReminders()
    return successResponse(reminders)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireStaff()
    const body = await request.json()
    const { booking_ids, days_threshold = 7 } = body

    const bookingService = new BookingService()
    const notificationService = new NotificationService()
    
    const reminders = await bookingService.getPaymentReminders()
    const filteredReminders = booking_ids 
      ? reminders.filter((r) => booking_ids.includes(r.id))
      : reminders.filter((r) => r.days_until <= days_threshold && r.remaining_amount > 0)

    const results = []
    for (const reminder of filteredReminders) {
      try {
        await notificationService.sendPaymentReminder(reminder, reminder.days_until)
        results.push({ booking_id: reminder.id, success: true })
      } catch (error: any) {
        results.push({ booking_id: reminder.id, success: false, error: error.message })
      }
    }

    return successResponse({ sent: results.length, results })
  } catch (error) {
    return handleApiError(error)
  }
}
