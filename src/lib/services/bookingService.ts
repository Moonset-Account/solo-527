import type { Database, BookingStatus, PaymentStatus, ContractStatus } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

export interface CreateBookingInput {
  client_id: string
  studio_id?: string
  package_id?: string
  start_time: string
  end_time: string
  total_amount: number
  deposit_amount: number
  photographer_id?: string
  notes?: string
  equipment_items?: Array<{
    equipment_id: string
    quantity: number
    unit_price: number
  }>
  assistant_items?: Array<{
    assistant_id: string
    hours: number
    unit_price: number
  }>
}

export interface UpdateBookingInput {
  status?: BookingStatus
  contract_status?: ContractStatus
  payment_status?: PaymentStatus
  start_time?: string
  end_time?: string
  studio_id?: string
  notes?: string
  deposit_amount?: number
  total_amount?: number
}

export class BookingService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase = supabase || createClient()
  }

  async checkAvailability(
    studioId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<boolean> {
    let query = this.supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('studio_id', studioId)
      .in('status', ['confirmed', 'in_progress', 'pending'])

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId)
    }

    const { data: existingBookings } = await query

    if (!existingBookings) return true

    return !existingBookings.some((booking) => {
      const bookingStart = new Date(booking.start_time).getTime()
      const bookingEnd = new Date(booking.end_time).getTime()
      const newStart = new Date(startTime).getTime()
      const newEnd = new Date(endTime).getTime()
      return newStart < bookingEnd && newEnd > bookingStart
    })
  }

  async checkEquipmentAvailability(
    equipmentIds: string[],
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<string[]> {
    const { data: bookingEquipment } = await this.supabase
      .from('booking_equipment')
      .select('equipment_id, bookings!inner(start_time, end_time)')
      .in('bookings.status', ['confirmed', 'in_progress', 'pending'])

    if (!bookingEquipment) return []

    const conflictingIds: string[] = []

    for (const equipmentId of equipmentIds) {
      const bookings = bookingEquipment.filter((be) => be.equipment_id === equipmentId)
      const hasConflict = bookings.some((be) => {
        const bookingStart = new Date(be.bookings.start_time).getTime()
        const bookingEnd = new Date(be.bookings.end_time).getTime()
        const newStart = new Date(startTime).getTime()
        const newEnd = new Date(endTime).getTime()
        return newStart < bookingEnd && newEnd > bookingStart
      })

      if (hasConflict) {
        conflictingIds.push(equipmentId)
      }
    }

    return conflictingIds
  }

  async createBooking(input: CreateBookingInput, userId: string) {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user?.user) throw new Error('未登录')

    if (input.studio_id) {
      const available = await this.checkAvailability(
        input.studio_id,
        input.start_time,
        input.end_time
      )
      if (!available) throw new Error('该时段棚位已被预订')
    }

    if (input.equipment_items && input.equipment_items.length > 0) {
      const equipmentIds = input.equipment_items.map((e) => e.equipment_id)
      const conflictingIds = await this.checkEquipmentAvailability(
        equipmentIds,
        input.start_time,
        input.end_time
      )
      if (conflictingIds.length > 0) {
        throw new Error(`以下器材在该时段已被租用: ${conflictingIds.join(', ')}`)
      }
    }

    return await this.supabase.rpc('create_booking_with_items', {
      p_client_id: input.client_id,
      p_studio_id: input.studio_id,
      p_package_id: input.package_id,
      p_start_time: input.start_time,
      p_end_time: input.end_time,
      p_total_amount: input.total_amount,
      p_deposit_amount: input.deposit_amount,
      p_photographer_id: input.photographer_id,
      p_notes: input.notes,
      p_created_by: userId,
      p_equipment_items: input.equipment_items || [],
      p_assistant_items: input.assistant_items || [],
    })
  }

  async updateBooking(bookingId: string, input: UpdateBookingInput) {
    const { data: existingBooking } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!existingBooking) throw new Error('订单不存在')

    if (input.studio_id && (input.start_time || input.end_time)) {
      const available = await this.checkAvailability(
        input.studio_id,
        input.start_time || existingBooking.start_time,
        input.end_time || existingBooking.end_time,
        bookingId
      )
      if (!available) throw new Error('改期后棚位冲突')
    }

    const { data, error } = await this.supabase
      .from('bookings')
      .update(input)
      .eq('id', bookingId)
      .select()
      .single()

    if (error) throw error

    if (input.status === 'rescheduled' && existingBooking.status !== 'rescheduled') {
      await this.supabase.from('notifications').insert({
        type: 'in_app',
        recipient: existingBooking.client_id,
        subject: '订单已改期',
        content: `订单 ${existingBooking.booking_no} 已改期`,
        booking_id: bookingId,
      })
    }

    return data
  }

  async cancelBooking(bookingId: string, reason?: string) {
    const { data: booking } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (!booking) throw new Error('订单不存在')

    await this.supabase.from('booking_equipment')
      .update({ return_time: new Date().toISOString() })
      .eq('booking_id', bookingId)

    return await this.supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        notes: reason ? `${booking.notes || ''}\n取消原因: ${reason}` : booking.notes,
      })
      .eq('id', bookingId)
      .select()
      .single()
  }

  async getBookings(filters?: {
    status?: BookingStatus
    studio_id?: string
    client_id?: string
    start_date?: string
    end_date?: string
  }) {
    let query = this.supabase
      .from('bookings')
      .select(`
        *,
        clients!inner(name, phone),
        studios(name),
        booking_equipment (
          id,
          quantity,
          unit_price,
          equipment (id, name, sku)
        ),
        booking_assistants (
          id,
          hours,
          unit_price,
          assistants (id, name)
        )
      `)
      .order('start_time', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.studio_id) {
      query = query.eq('studio_id', filters.studio_id)
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    if (filters?.start_date) {
      query = query.gte('start_time', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('end_time', filters.end_date)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async getBookingById(bookingId: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        *,
        clients!inner(*),
        studios(*),
        packages(*),
        profiles_photographer:profiles!bookings_photographer_id_fkey(full_name),
        profiles_creator:profiles!bookings_created_by_fkey(full_name),
        booking_equipment (
          *,
          equipment(*)
        ),
        booking_assistants (
          *,
          assistants(*)
        ),
        payments(*)
      `)
      .eq('id', bookingId)
      .single()

    if (error) throw error
    return data
  }

  async getCalendarBookings(startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        id,
        booking_no,
        status,
        start_time,
        end_time,
        studio_id,
        total_amount,
        payment_status,
        clients!inner(name),
        studios(name)
      `)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .in('status', ['confirmed', 'pending', 'in_progress'])
      .order('start_time', { ascending: true })

    if (error) throw error
    return data
  }

  async getPaymentReminders() {
    const { data, error } = await this.supabase
      .from('bookings')
      .select(`
        id,
        booking_no,
        total_amount,
        deposit_amount,
        paid_amount,
        payment_status,
        start_time,
        clients(name, phone, email)
      `)
      .in('payment_status', ['unpaid', 'deposit_paid', 'partial_paid'])
      .in('status', ['confirmed', 'in_progress'])
      .order('start_time', { ascending: true })

    if (error) throw error

    return data.map((booking) => ({
      ...booking,
      remaining_amount: booking.total_amount - booking.paid_amount,
      days_until: Math.ceil(
        (new Date(booking.start_time).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    }))
  }
}
