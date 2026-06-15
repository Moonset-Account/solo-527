'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Booking, BookingCreateRequest, BookingStatus, Instrument, Station, Project, Sample } from '@/types'

export async function createBooking(data: BookingCreateRequest): Promise<{
  booking?: Booking
  has_conflict?: boolean
  conflicting_bookings?: Booking[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { error: 'Supabase 未配置' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: '未登录或会话已过期' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    const userId = userData?.id || user.id

    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select(`
        *,
        instrument:instruments(*),
        station:stations(*),
        project:projects(*)
      `)
      .eq('station_id', data.station_id)
      .neq('status', 'cancelled' as BookingStatus)
      .lt('start_time', data.end_time)
      .gt('end_time', data.start_time)

    if (conflictError) {
      return { error: conflictError.message }
    }

    if (conflicts && conflicts.length > 0) {
      return {
        has_conflict: true,
        conflicting_bookings: conflicts as Booking[],
      }
    }

    const { data: newBooking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        instrument_id: data.instrument_id,
        station_id: data.station_id,
        project_id: data.project_id || null,
        start_time: data.start_time,
        end_time: data.end_time,
        status: 'pending',
        notes: data.notes || null,
      })
      .select(`
        *,
        instrument:instruments(*),
        station:stations(*),
        project:projects(*)
      `)
      .single()

    if (insertError) {
      return { error: insertError.message }
    }

    if (data.sample_ids && data.sample_ids.length > 0) {
      const bookingSamples = data.sample_ids.map((sampleId) => ({
        booking_id: (newBooking as Booking).id,
        sample_id: sampleId,
      }))
      await supabase.from('booking_samples').insert(bookingSamples)
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'create_booking',
      resource_type: 'booking',
      resource_id: (newBooking as Booking).id,
      details: {
        instrument_id: data.instrument_id,
        station_id: data.station_id,
        start_time: data.start_time,
        end_time: data.end_time,
      },
    })

    return { booking: newBooking as Booking }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '创建预约失败' }
  }
}

export async function cancelBooking(bookingId: string): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { error: 'Supabase 未配置' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: '未登录或会话已过期' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    const userId = userData?.id || user.id
    const userRole = userData?.role || 'researcher'

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, user_id')
      .eq('id', bookingId)
      .single()

    if (!booking) {
      return { error: '预约不存在' }
    }

    if (booking.user_id !== userId && userRole !== 'admin') {
      return { error: '无权限取消此预约' }
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' as BookingStatus })
      .eq('id', bookingId)

    if (updateError) {
      return { error: updateError.message }
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'cancel_booking',
      resource_type: 'booking',
      resource_id: bookingId,
      details: {},
    })

    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '取消预约失败' }
  }
}

export async function completeBooking(bookingId: string): Promise<{
  success?: boolean
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { error: 'Supabase 未配置' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: '未登录或会话已过期' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .single()

    const userId = userData?.id || user.id

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, instrument_id, start_time, end_time')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return { error: '预约不存在' }
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'completed' as BookingStatus })
      .eq('id', bookingId)

    if (updateError) {
      return { error: updateError.message }
    }

    const start = new Date(booking.start_time)
    const end = new Date(booking.end_time)
    const usedHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60))
    const logDate = start.toISOString().slice(0, 10)

    const { data: existingLog } = await supabase
      .from('utilization_logs')
      .select('*')
      .eq('instrument_id', booking.instrument_id)
      .eq('log_date', logDate)
      .maybeSingle()

    if (existingLog) {
      await supabase
        .from('utilization_logs')
        .update({
          used_hours: (existingLog.used_hours as number) + usedHours,
        })
        .eq('id', existingLog.id)
    } else {
      await supabase.from('utilization_logs').insert({
        instrument_id: booking.instrument_id,
        log_date: logDate,
        total_hours: 24,
        used_hours: usedHours,
        disabled_hours: 0,
      })
    }

    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: 'complete_booking',
      resource_type: 'booking',
      resource_id: bookingId,
      details: { used_hours: usedHours },
    })

    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : '完成预约失败' }
  }
}

export async function getMyBookings(): Promise<{
  bookings?: Booking[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { bookings: [] }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { bookings: [] }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    const userId = userData?.id || user.id

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        instrument:instruments(*),
        station:stations(*),
        project:projects(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return { bookings: [] }
    }

    return { bookings: (bookings || []) as Booking[] }
  } catch {
    return { bookings: [] }
  }
}

export async function getAllBookings(): Promise<{
  bookings?: Booking[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { bookings: [] }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: '未登录或会话已过期' }
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return { error: '无权限查看全部预约' }
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        instrument:instruments(*),
        station:stations(*),
        project:projects(*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return { bookings: [] }
    }

    return { bookings: (bookings || []) as Booking[] }
  } catch {
    return { bookings: [] }
  }
}

export async function listStations(instrumentId?: string): Promise<{
  stations?: Station[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { stations: [] }
    }

    let query = supabase
      .from('stations')
      .select('*')
      .order('created_at', { ascending: true })

    if (instrumentId) {
      query = query.eq('instrument_id', instrumentId)
    }

    const { data: stations, error } = await query

    if (error) {
      return { stations: [] }
    }

    return { stations: (stations || []) as Station[] }
  } catch {
    return { stations: [] }
  }
}

export async function listProjects(): Promise<{
  projects?: Project[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { projects: [] }
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return { projects: [] }
    }

    return { projects: (projects || []) as Project[] }
  } catch {
    return { projects: [] }
  }
}

export async function listSamples(projectId?: string): Promise<{
  samples?: Sample[]
  error?: string
}> {
  try {
    const supabase = createSupabaseServerClient()
    if (!supabase) {
      return { samples: [] }
    }

    let query = supabase
      .from('samples')
      .select('*')
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: samples, error } = await query

    if (error) {
      return { samples: [] }
    }

    return { samples: (samples || []) as Sample[] }
  } catch {
    return { samples: [] }
  }
}
