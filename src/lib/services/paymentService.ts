import type { PaymentStatus } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

export interface CreatePaymentInput {
  booking_id: string
  amount: number
  payment_method: string
  transaction_no?: string
  is_deposit?: boolean
  notes?: string
}

export class PaymentService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase = supabase || createClient()
  }

  async createPayment(input: CreatePaymentInput, userId: string) {
    const { data: booking } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('id', input.booking_id)
      .single()

    if (!booking) throw new Error('订单不存在')

    const newPaidAmount = booking.paid_amount + input.amount
    let newPaymentStatus: PaymentStatus = booking.payment_status

    if (newPaidAmount >= booking.total_amount) {
      newPaymentStatus = 'paid'
    } else if (input.is_deposit && newPaidAmount >= booking.deposit_amount) {
      newPaymentStatus = 'deposit_paid'
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'partial_paid'
    }

    const { data: payment, error } = await this.supabase
      .from('payments')
      .insert({
        ...input,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    await this.supabase
      .from('bookings')
      .update({
        paid_amount: newPaidAmount,
        payment_status: newPaymentStatus,
      })
      .eq('id', input.booking_id)

    return payment
  }

  async getPayments(bookingId?: string) {
    let query = this.supabase
      .from('payments')
      .select(`
        *,
        bookings(booking_no),
        creator:profiles!payments_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })

    if (bookingId) {
      query = query.eq('booking_id', bookingId)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async processRefund(paymentId: string, refundAmount: number, notes?: string) {
    const { data: payment } = await this.supabase
      .from('payments')
      .select('*, bookings(*)')
      .eq('id', paymentId)
      .single()

    if (!payment) throw new Error('支付记录不存在')

    const booking = payment.bookings
    const newPaidAmount = booking.paid_amount - refundAmount

    let newPaymentStatus: PaymentStatus
    if (newPaidAmount <= 0) {
      newPaymentStatus = 'refunded'
    } else if (newPaidAmount >= booking.total_amount) {
      newPaymentStatus = 'paid'
    } else if (newPaidAmount >= booking.deposit_amount) {
      newPaymentStatus = 'deposit_paid'
    } else {
      newPaymentStatus = 'partial_paid'
    }

    await this.supabase
      .from('bookings')
      .update({
        paid_amount: newPaidAmount,
        payment_status: newPaymentStatus,
      })
      .eq('id', booking.id)

    const { data: refund, error } = await this.supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        amount: -refundAmount,
        payment_method: 'refund',
        notes: notes || '退款',
        created_by: (await this.supabase.auth.getUser()).data.user?.id!,
      })
      .select()
      .single()

    if (error) throw error
    return refund
  }

  async getPaymentSummary() {
    const { data, error } = await this.supabase
      .from('payments')
      .select('amount, created_at, payment_method')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (error) throw error

    const totalRevenue = data.reduce((sum, p) => sum + (p.amount > 0 ? p.amount : 0), 0)
    const totalRefunds = data.reduce((sum, p) => sum + (p.amount < 0 ? Math.abs(p.amount) : 0), 0)

    return {
      total_revenue: totalRevenue,
      total_refunds: totalRefunds,
      net_revenue: totalRevenue - totalRefunds,
      transaction_count: data.length,
    }
  }
}
