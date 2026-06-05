import type { Database, EquipmentStatus, DamageSeverity } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

export interface CreateEquipmentInput {
  name: string
  sku?: string
  category_id?: string
  description?: string
  hourly_rate: number
  daily_rate?: number
  purchase_price?: number
  purchase_date?: string
  serial_number?: string
  brand?: string
  model?: string
  notes?: string
  images?: string[]
}

export interface CreateDamageReportInput {
  equipment_id: string
  booking_id?: string
  responsible_party: string
  severity: DamageSeverity
  description: string
  repair_cost?: number
  images?: string[]
}

export class EquipmentService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase = supabase || createClient()
  }

  async getEquipment(filters?: {
    category_id?: string
    status?: EquipmentStatus
    search?: string
    page?: number
    page_size?: number
  }) {
    let query = this.supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories(name)
      `)
      .order('created_at', { ascending: false })

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async getEquipmentById(id: string) {
    const { data, error } = await this.supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories(name),
        equipment_damages (
          *,
          bookings(booking_no),
          reporter:profiles!equipment_damages_reporter_id_fkey(full_name)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createEquipment(input: CreateEquipmentInput) {
    const { data, error } = await this.supabase
      .from('equipment')
      .insert(input)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateEquipment(id: string, input: Partial<CreateEquipmentInput> & { status?: EquipmentStatus }) {
    const { data, error } = await this.supabase
      .from('equipment')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateEquipmentStatus(id: string, status: EquipmentStatus) {
    const { data, error } = await this.supabase
      .from('equipment')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getEquipmentWithRentals(startDate: string, endDate: string) {
    const { data, error } = await this.supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories(name),
        booking_equipment (
          id,
          quantity,
          pickup_time,
          return_time,
          bookings (
            id,
            booking_no,
            start_time,
            end_time,
            status,
            clients(name)
          )
        )
      `)
      .order('name')

    if (error) throw error

    return data.map((equipment) => ({
      ...equipment,
      current_rentals: equipment.booking_equipment?.filter((be) => {
        if (!be.bookings) return false
        const bookingStart = new Date(be.bookings.start_time).getTime()
        const bookingEnd = new Date(be.bookings.end_time).getTime()
        const start = new Date(startDate).getTime()
        const end = new Date(endDate).getTime()
        return bookingStart < end && bookingEnd > start
      }) || [],
    }))
  }

  async pickupEquipment(bookingEquipmentId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('booking_equipment')
      .update({
        pickup_time: new Date().toISOString(),
        pickup_by: userId,
      })
      .eq('id', bookingEquipmentId)
      .select(`
        *,
        equipment(*),
        bookings(*)
      `)
      .single()

    if (error) throw error

    if (data.equipment_id) {
      await this.updateEquipmentStatus(data.equipment_id, 'rented')
    }

    return data
  }

  async returnEquipment(bookingEquipmentId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('booking_equipment')
      .update({
        return_time: new Date().toISOString(),
        return_by: userId,
      })
      .eq('id', bookingEquipmentId)
      .select(`
        *,
        equipment(*),
        bookings(*)
      `)
      .single()

    if (error) throw error

    if (data.equipment_id) {
      await this.updateEquipmentStatus(data.equipment_id, 'available')
    }

    return data
  }

  async reportDamage(input: CreateDamageReportInput, reporterId: string) {
    const { data, error } = await this.supabase
      .from('equipment_damages')
      .insert({
        ...input,
        reporter_id: reporterId,
        status: 'reported',
      })
      .select()
      .single()

    if (error) throw error

    await this.updateEquipmentStatus(input.equipment_id, 'damaged')

    return data
  }

  async getDamageReports(filters?: {
    equipment_id?: string
    booking_id?: string
    status?: string
  }) {
    let query = this.supabase
      .from('equipment_damages')
      .select(`
        *,
        equipment(name, sku),
        bookings(booking_no),
        reporter:profiles!equipment_damages_reporter_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false })

    if (filters?.equipment_id) {
      query = query.eq('equipment_id', filters.equipment_id)
    }
    if (filters?.booking_id) {
      query = query.eq('booking_id', filters.booking_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async updateDamageReport(id: string, updates: {
    status?: string
    repair_cost?: number
    description?: string
  }) {
    const { data, error } = await this.supabase
      .from('equipment_damages')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (updates.status === 'resolved' && data.equipment_id) {
      await this.updateEquipmentStatus(data.equipment_id, 'available')
    }

    return data
  }

  async getCategories() {
    const { data, error } = await this.supabase
      .from('equipment_categories')
      .select('*')
      .order('sort_order')

    if (error) throw error
    return data
  }

  async getEquipmentByQRCode(qrCode: string) {
    const { data, error } = await this.supabase
      .from('equipment')
      .select(`
        *,
        equipment_categories(name)
      `)
      .eq('qr_code', qrCode)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async getRentalHistory(equipmentId: string) {
    const { data, error } = await this.supabase
      .from('booking_equipment')
      .select(`
        id,
        quantity,
        unit_price,
        pickup_time,
        return_time,
        pickup_by_user:profiles!booking_equipment_pickup_by_fkey(full_name),
        return_by_user:profiles!booking_equipment_return_by_fkey(full_name),
        bookings (
          booking_no,
          start_time,
          end_time,
          clients(name)
        )
      `)
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
