// @ts-nocheck
import { createClient } from '@/lib/supabase/server'

export interface CreateClientInput {
  name: string
  company?: string
  phone: string
  email?: string
  address?: string
  notes?: string
}

export class ClientService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase = supabase || createClient()
  }

  async getClients(filters?: {
    search?: string
    page?: number
    page_size?: number
  }) {
    let query = this.supabase
      .from('clients')
      .select(`
        *,
        creator:profiles!clients_created_by_fkey(full_name),
        bookings(count)
      `)
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async getClientById(id: string) {
    const { data, error } = await this.supabase
      .from('clients')
      .select(`
        *,
        creator:profiles!clients_created_by_fkey(full_name),
        bookings (
          id,
          booking_no,
          status,
          start_time,
          end_time,
          total_amount,
          payment_status
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createClient(input: CreateClientInput, userId: string) {
    const { data, error } = await this.supabase
      .from('clients')
      .insert({
        ...input,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateClient(id: string, input: Partial<CreateClientInput>) {
    const { data, error } = await this.supabase
      .from('clients')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getClientStats(clientId: string) {
    const { data: bookings } = await this.supabase
      .from('bookings')
      .select('total_amount, payment_status, status')
      .eq('client_id', clientId)

    if (!bookings) {
      return {
        total_bookings: 0,
        total_spent: 0,
        completed_bookings: 0,
        pending_payments: 0,
      }
    }

    const totalBookings = bookings.length
    const totalSpent = bookings.reduce((sum, b) => sum + b.total_amount, 0)
    const completedBookings = bookings.filter((b) => b.status === 'completed').length
    const pendingPayments = bookings
      .filter((b) => b.payment_status !== 'paid' && b.payment_status !== 'refunded')
      .reduce((sum, b) => sum + b.total_amount, 0)

    return {
      total_bookings: totalBookings,
      total_spent: totalSpent,
      completed_bookings: completedBookings,
      pending_payments: pendingPayments,
    }
  }
}
