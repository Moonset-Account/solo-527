import { createClient } from '@/lib/supabase/server'

export interface CreateQuotationInput {
  client_id: string
  studio_id?: string
  start_time?: string
  end_time?: string
  valid_until?: string
  notes?: string
  equipment_items?: Array<{
    equipment_id: string
    quantity: number
    unit_price: number
  }>
}

export class QuotationService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase = supabase || createClient()
  }

  async createQuotation(input: CreateQuotationInput, userId: string) {
    const totalAmount = input.equipment_items?.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price
    }, 0) || 0

    const { data: quotation, error } = await this.supabase
      .from('quotations')
      .insert({
        client_id: input.client_id,
        studio_id: input.studio_id,
        start_time: input.start_time,
        end_time: input.end_time,
        valid_until: input.valid_until,
        notes: input.notes,
        total_amount: totalAmount,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    if (input.equipment_items && input.equipment_items.length > 0) {
      const equipmentData = input.equipment_items.map((item) => ({
        quotation_id: quotation.id,
        equipment_id: item.equipment_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))

      await this.supabase.from('quotation_equipment').insert(equipmentData)
    }

    return quotation
  }

  async getQuotations(filters?: {
    client_id?: string
    status?: string
  }) {
    let query = this.supabase
      .from('quotations')
      .select(`
        *,
        clients(name, phone, company),
        studios(name),
        quotation_equipment (
          *,
          equipment(name, sku)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async getQuotationById(id: string) {
    const { data, error } = await this.supabase
      .from('quotations')
      .select(`
        *,
        clients(*),
        studios(*),
        creator:profiles!quotations_created_by_fkey(full_name),
        quotation_equipment (
          *,
          equipment(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async updateQuotationStatus(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('quotations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async convertToBooking(quotationId: string, userId: string) {
    const quotation = await this.getQuotationById(quotationId)
    if (!quotation) throw new Error('报价单不存在')

    const { data: booking, error: bookingError } = await this.supabase
      .from('bookings')
      .insert({
        client_id: quotation.client_id,
        studio_id: quotation.studio_id,
        start_time: quotation.start_time || new Date().toISOString(),
        end_time: quotation.end_time || new Date().toISOString(),
        total_amount: quotation.total_amount,
        deposit_amount: quotation.total_amount * 0.3,
        created_by: userId,
        status: 'draft',
      })
      .select()
      .single()

    if (bookingError) throw bookingError

    if (quotation.quotation_equipment && quotation.quotation_equipment.length > 0) {
      const bookingEquipment = quotation.quotation_equipment.map((qe) => ({
        booking_id: booking.id,
        equipment_id: qe.equipment_id,
        quantity: qe.quantity,
        unit_price: qe.unit_price,
      }))

      await this.supabase.from('booking_equipment').insert(bookingEquipment)
    }

    await this.updateQuotationStatus(quotationId, 'converted')

    return booking
  }
}
