// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date()
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_no,
        start_time,
        total_amount,
        paid_amount,
        payment_status,
        clients(name, phone, email)
      `)
      .gte('start_time', today.toISOString())
      .lte('start_time', threeDaysLater.toISOString())
      .in('payment_status', ['unpaid', 'deposit_paid', 'partial_paid'])
      .in('status', ['confirmed', 'in_progress'])

    if (upcomingBookings && upcomingBookings.length > 0) {
      for (const booking of upcomingBookings) {
        const remainingAmount = booking.total_amount - booking.paid_amount
        const daysUntil = Math.ceil(
          (new Date(booking.start_time).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        await supabase.from('notifications').insert({
          type: 'sms',
          recipient: booking.clients.phone,
          subject: '尾款提醒',
          content: `订单${booking.booking_no}将于${daysUntil}天后拍摄，剩余尾款${remainingAmount}元，请及时支付。`,
          booking_id: booking.id,
        })

        if (booking.clients.email) {
          await supabase.from('notifications').insert({
            type: 'email',
            recipient: booking.clients.email,
            subject: `尾款提醒 - 订单${booking.booking_no}`,
            content: `尊敬的${booking.clients.name}，您的订单${booking.booking_no}将于${daysUntil}天后拍摄，剩余尾款${remainingAmount}元，请及时支付。`,
            booking_id: booking.id,
          })
        }
      }
    }

    const { data: pendingNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .limit(20)

    if (pendingNotifications && pendingNotifications.length > 0) {
      for (const notification of pendingNotifications) {
        try {
          if (notification.type === 'sms') {
            console.log(`[SMS] To: ${notification.recipient}, Content: ${notification.content}`)
          } else if (notification.type === 'email') {
            console.log(`[Email] To: ${notification.recipient}, Subject: ${notification.subject}`)
          } else if (notification.type === 'in_app') {
            console.log(`[In-App] To: ${notification.recipient}, Content: ${notification.content}`)
          }

          await supabase
            .from('notifications')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', notification.id)
        } catch (error: any) {
          await supabase
            .from('notifications')
            .update({ status: 'failed', error_message: error.message })
            .eq('id', notification.id)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_reminders_sent: upcomingBookings?.length || 0,
        notifications_processed: pendingNotifications?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
