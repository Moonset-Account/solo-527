'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notification-service'

interface CreateOrderParams {
  customerId: string
  studioId: string
  packageId?: string
  startTime: string
  endTime: string
  equipmentIds?: string[]
  notes?: string
}

export async function createOrder(params: CreateOrderParams) {
  const supabase = createClient()

  const { data: studio } = await supabase
    .from('studios')
    .select('hourly_rate')
    .eq('id', params.studioId)
    .single()

  const { data: customer } = await supabase
    .from('profiles')
    .select('email, phone, full_name')
    .eq('id', params.customerId)
    .single()

  if (!studio) throw new Error('Studio not found')

  const start = new Date(params.startTime)
  const end = new Date(params.endTime)
  const hours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)))

  let totalAmount = studio.hourly_rate * hours
  let depositAmount = 0

  if (params.packageId) {
    const { data: pkg } = await supabase
      .from('packages')
      .select('base_price')
      .eq('id', params.packageId)
      .single()
    if (pkg) totalAmount = pkg.base_price
  }

  const orderEquipmentData: any[] = []
  if (params.equipmentIds && params.equipmentIds.length > 0) {
    const { data: equipmentList } = await supabase
      .from('equipment')
      .select('id, rental_price, deposit_amount')
      .in('id', params.equipmentIds)

    if (equipmentList) {
      for (const eq of equipmentList) {
        totalAmount += eq.rental_price
        depositAmount += eq.deposit_amount
        orderEquipmentData.push({
          equipment_id: eq.id,
          rental_price: eq.rental_price,
          deposit_amount: eq.deposit_amount,
          is_extra: false,
        })
      }
    }
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: params.customerId,
      studio_id: params.studioId,
      package_id: params.packageId,
      start_time: params.startTime,
      end_time: params.endTime,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      notes: params.notes,
    })
    .select()
    .single()

  if (orderError) throw orderError

  if (orderEquipmentData.length > 0) {
    const { error: oeError } = await supabase
      .from('order_equipment')
      .insert(orderEquipmentData.map((item) => ({ ...item, order_id: order.id })))

    if (oeError) throw oeError
  }

  await createNotification({
    userId: params.customerId,
    type: 'order_status',
    title: '订单创建成功',
    content: `您的订单 ${order.order_number} 已创建，等待店员确认。`,
    relatedOrderId: order.id,
    sendEmail: true,
    recipientEmail: customer?.email,
  })

  return order
}

export async function confirmOrder(orderId: string, staffId: string) {
  const supabase = createClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'confirmed',
      confirmed_by: staffId,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single()

  if (orderError) throw orderError

  const { data: customer } = await supabase
    .from('profiles')
    .select('email, phone, full_name')
    .eq('id', order.customer_id)
    .single()

  await createNotification({
    userId: order.customer_id,
    type: 'order_status',
    title: '订单已确认',
    content: `您的订单 ${order.order_number} 已确认，请按时到达。`,
    relatedOrderId: order.id,
    sendEmail: true,
    recipientEmail: customer?.email,
  })

  return order
}

export async function addExtraEquipment(orderId: string, equipmentId: string, staffId: string) {
  const supabase = createClient()

  const { data: equipment } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', equipmentId)
    .single()

  if (!equipment) throw new Error('Equipment not found')

  const { data: existing } = await supabase
    .from('order_equipment')
    .select('id')
    .eq('order_id', orderId)
    .eq('equipment_id', equipmentId)
    .maybeSingle()

  if (existing) {
    throw new Error('该器材已在订单中')
  }

  const { data: orderEquipment, error: oeError } = await supabase
    .from('order_equipment')
    .insert({
      order_id: orderId,
      equipment_id: equipmentId,
      rental_price: equipment.rental_price,
      deposit_amount: equipment.deposit_amount,
      is_extra: true,
    })
    .select()
    .single()

  if (oeError) throw oeError

  const { data: order } = await supabase
    .from('orders')
    .select('total_amount, deposit_amount, customer_id')
    .eq('id', orderId)
    .single()

  if (order) {
    await supabase
      .from('orders')
      .update({
        total_amount: order.total_amount + equipment.rental_price,
        deposit_amount: order.deposit_amount + equipment.deposit_amount,
      })
      .eq('id', orderId)

    await supabase.from('deposit_transactions').insert({
      order_id: orderId,
      type: 'charge',
      amount: equipment.deposit_amount,
      notes: `临时添加器材: ${equipment.name}`,
      created_by: staffId,
    })

    const { data: customer } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', order.customer_id)
      .single()

    await createNotification({
      userId: order.customer_id,
      type: 'order_status',
      title: '订单已更新',
      content: `您的订单已添加器材 ${equipment.name}，需补交押金 ${equipment.deposit_amount} 元。`,
      relatedOrderId: orderId,
      sendEmail: true,
      recipientEmail: customer?.email,
    })
  }

  return orderEquipment
}

export async function pickupEquipment(orderEquipmentId: string, staffId: string) {
  const supabase = createClient()

  const { data: orderEquipment } = await supabase
    .from('order_equipment')
    .update({
      picked_up: true,
      picked_up_by: staffId,
      picked_up_at: new Date().toISOString(),
    })
    .eq('id', orderEquipmentId)
    .select()
    .single()

  if (orderEquipment) {
    await supabase
      .from('equipment')
      .update({ status: 'in_use' })
      .eq('id', orderEquipment.equipment_id)
  }

  return orderEquipment
}

export async function returnEquipment(orderEquipmentId: string, staffId: string) {
  const supabase = createClient()

  const { data: orderEquipment } = await supabase
    .from('order_equipment')
    .update({
      returned: true,
      returned_by: staffId,
      returned_at: new Date().toISOString(),
    })
    .eq('id', orderEquipmentId)
    .select()
    .single()

  if (orderEquipment) {
    await supabase
      .from('equipment')
      .update({ status: 'available' })
      .eq('id', orderEquipment.equipment_id)

    const { data: order } = await supabase
      .from('orders')
      .select('customer_id, order_number')
      .eq('id', orderEquipment.order_id)
      .single()

    if (order) {
      await createNotification({
        userId: order.customer_id,
        type: 'equipment_return',
        title: '器材已归还',
        content: `订单 ${order.order_number} 的器材已确认归还。`,
        relatedOrderId: orderEquipment.order_id,
      })
    }
  }

  return orderEquipment
}
