'use server'

import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notification-service'
import { formatDate } from '@/lib/utils'
import { Database } from '@/types/database'
import type {
  Order,
  OrderEquipment,
  Studio,
  Equipment,
  Profile,
  AvailabilityCheckResult,
  CreateDamageRecordRequest,
  DamageRecord,
  Contract,
  OrderWithDetails,
} from '@/types'

type OrderRow = Database['public']['Tables']['orders']['Row']
type OrderInsert = Database['public']['Tables']['orders']['Insert']
type OrderUpdate = Database['public']['Tables']['orders']['Update']
type OrderEquipmentRow = Database['public']['Tables']['order_equipment']['Row']
type OrderEquipmentInsert = Database['public']['Tables']['order_equipment']['Insert']
type OrderEquipmentUpdate = Database['public']['Tables']['order_equipment']['Update']
type DamageRecordRow = Database['public']['Tables']['damage_records']['Row']
type DamageRecordInsert = Database['public']['Tables']['damage_records']['Insert']
type DamageRecordUpdate = Database['public']['Tables']['damage_records']['Update']

interface CreateOrderParams {
  customerId: string
  studioId: string
  packageId?: string
  startTime: string
  endTime: string
  equipmentIds?: string[]
  notes?: string
}

export async function checkAvailability(
  studioId: string,
  startTime: string,
  endTime: string,
  equipmentIds: string[] = [],
  excludeOrderId?: string
): Promise<AvailabilityCheckResult> {
  const supabase = createClient()
  const conflicts: AvailabilityCheckResult['conflicts'] = []
  let hasError = false

  let studioQuery = supabase
    .from('orders')
    .select('id, order_number, start_time, end_time')
    .eq('studio_id', studioId)
    .in('status', ['confirmed', 'in_progress'])
    .lt('start_time', endTime)
    .gt('end_time', startTime)

  if (excludeOrderId) {
    studioQuery = studioQuery.neq('id', excludeOrderId)
  }

  const { data: studioConflicts, error: studioError } = await studioQuery

  if (studioError) {
    console.error('Studio availability check error:', studioError)
    hasError = true
    conflicts.push({
      type: 'studio',
      id: studioId,
      name: '棚位可用性校验失败，请稍后重试',
      conflictingOrderId: null,
    })
  } else if (studioConflicts && studioConflicts.length > 0) {
    conflicts.push({
      type: 'studio',
      id: studioId,
      name: '棚位已被预约',
      conflictingOrderId: (studioConflicts[0] as any).id,
    })
  }

  if (equipmentIds.length > 0) {
    const { data: equipmentList, error: equipmentError } = await supabase
      .from('equipment')
      .select('id, name, status')
      .in('id', equipmentIds)

    if (equipmentError) {
      console.error('Equipment status check error:', equipmentError)
      hasError = true
      conflicts.push({
        type: 'equipment',
        id: 'equipment_check_error',
        name: '器材状态校验失败，请稍后重试',
        conflictingOrderId: null,
      })
    } else {
      for (const eq of (equipmentList || []) as any[]) {
        if (eq.status !== 'available' && !conflicts.find(c => c.id === eq.id)) {
          conflicts.push({
            type: 'equipment',
            id: eq.id,
            name: eq.name,
            conflictingOrderId: null,
          })
        }
      }
    }

    let equipmentConflictQuery = supabase
      .from('order_equipment')
      .select(`
        id,
        order_id,
        equipment_id,
        equipment:equipment(id, name),
        order:orders(id, order_number)
      `)
      .in('equipment_id', equipmentIds)
      .eq('returned', false)

    if (excludeOrderId) {
      equipmentConflictQuery = equipmentConflictQuery.neq('order_id', excludeOrderId)
    }

    const { data: equipmentConflicts, error: conflictError } = await equipmentConflictQuery

    if (conflictError) {
      console.error('Equipment conflict check error:', conflictError)
      hasError = true
      if (!conflicts.find(c => c.id === 'equipment_check_error')) {
        conflicts.push({
          type: 'equipment',
          id: 'equipment_check_error',
          name: '器材占用校验失败，请稍后重试',
          conflictingOrderId: null,
        })
      }
    } else if (equipmentConflicts) {
      const conflictEquipmentIds = new Set<string>(conflicts.map(c => c.id))
      for (const ec of equipmentConflicts as any[]) {
        if (!conflictEquipmentIds.has(ec.equipment_id)) {
          conflictEquipmentIds.add(ec.equipment_id)
          conflicts.push({
            type: 'equipment',
            id: ec.equipment_id,
            name: ec.equipment?.name || '未知器材',
            conflictingOrderId: ec.order?.id,
          })
        }
      }
    }
  }

  return {
    available: !hasError && conflicts.length === 0,
    conflicts,
    hasError,
  }
}

export async function createOrder(params: CreateOrderParams) {
  const supabase = createClient()

  const availability = await checkAvailability(
    params.studioId,
    params.startTime,
    params.endTime,
    params.equipmentIds
  )

  if (!availability.available) {
    const conflictMessages = availability.conflicts?.map(c => 
      `${c.type === 'studio' ? '棚位' : '器材'}${c.name ? `「${c.name}」` : ''}在该时段不可用`
    ).join('；')
    throw new Error(`预约失败：${conflictMessages}`)
  }

  const { data: studioData } = await supabase
    .from('studios')
    .select('*')
    .eq('id', params.studioId)
    .single()
  const studio = studioData as Studio | null

  const { data: customerData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.customerId)
    .single()
  const customer = customerData as Profile | null

  if (!studio) throw new Error('Studio not found')

  const start = new Date(params.startTime)
  const end = new Date(params.endTime)
  const hours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)))

  let totalAmount = studio.hourly_rate * hours
  let depositAmount = 0

  if (params.packageId) {
    const { data: pkgData } = await supabase
      .from('packages')
      .select('base_price')
      .eq('id', params.packageId)
      .single()
    const pkg = pkgData as { base_price: number } | null
    if (pkg) totalAmount = pkg.base_price
  }

  const orderEquipmentData: Array<Omit<OrderEquipmentInsert, 'order_id'>> = []
  if (params.equipmentIds && params.equipmentIds.length > 0) {
    const { data: equipmentListData } = await supabase
      .from('equipment')
      .select('*')
      .in('id', params.equipmentIds)
    const equipmentList = equipmentListData as Equipment[] | null

    if (equipmentList) {
      for (const eq of equipmentList) {
        totalAmount += eq.rental_price
        depositAmount += eq.deposit_amount
        orderEquipmentData.push({
          equipment_id: eq.id,
          quantity: 1,
          rental_price: eq.rental_price,
          deposit_amount: eq.deposit_amount,
          is_extra: false,
          picked_up: false,
          picked_up_by: null,
          picked_up_at: null,
          returned: false,
          returned_by: null,
          returned_at: null,
        })
      }
    }
  }

  const { data: orderData, error: orderError } = await supabase
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
    } as OrderInsert)
    .select()
    .single()

  if (orderError) throw orderError
  const order = orderData as Order | null
  if (!order) throw new Error('创建订单失败')

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
    content: `您的订单 ${order.order_number} 已创建，等待店员确认。拍摄时间：${formatDate(order.start_time)} - ${formatDate(order.end_time)}`,
    relatedOrderId: order.id,
    sendEmail: !!customer?.email,
    recipientEmail: customer?.email,
    sendSms: !!customer?.phone,
    recipientPhone: customer?.phone,
    priority: 'high',
  })

  return order
}

export async function confirmOrder(orderId: string, staffId: string) {
  const supabase = createClient()

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'confirmed',
      confirmed_by: staffId,
      confirmed_at: new Date().toISOString(),
    } as OrderUpdate)
    .eq('id', orderId)
    .select()
    .single()

  if (orderError) throw orderError
  const order = orderData as Order | null
  if (!order) throw new Error('订单不存在')

  const { data: customerData } = await supabase
    .from('profiles')
    .select('email, phone, full_name')
    .eq('id', order.customer_id)
    .single()
  const customer = customerData as Profile | null

  await createNotification({
    userId: order.customer_id,
    type: 'order_status',
    title: '订单已确认',
    content: `您的订单 ${order.order_number} 已确认，请按时到达拍摄。棚位：${order.studio_id}，时间：${formatDate(order.start_time)}`,
    relatedOrderId: order.id,
    sendEmail: !!customer?.email,
    recipientEmail: customer?.email,
    sendSms: !!customer?.phone,
    recipientPhone: customer?.phone,
    priority: 'high',
  })

  return order
}

export async function addExtraEquipment(orderId: string, equipmentId: string, staffId: string) {
  const supabase = createClient()

  const { data: orderData } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()
  const order = orderData as Order | null

  if (!order) throw new Error('订单不存在')

  const availability = await checkAvailability(
    order.studio_id,
    order.start_time,
    order.end_time,
    [equipmentId],
    orderId
  )

  if (!availability.available) {
    throw new Error('该器材在订单时段内不可用')
  }

  const { data: equipmentData } = await supabase
    .from('equipment')
    .select('*')
    .eq('id', equipmentId)
    .single()
  const equipment = equipmentData as Equipment | null

  if (!equipment) throw new Error('器材不存在')

  const { data: existingData } = await supabase
    .from('order_equipment')
    .select('id')
    .eq('order_id', orderId)
    .eq('equipment_id', equipmentId)
    .maybeSingle()
  const existing = existingData as { id: string } | null

  if (existing) {
    throw new Error('该器材已在订单中')
  }

  const { data: orderEquipmentData, error: oeError } = await supabase
    .from('order_equipment')
    .insert({
      order_id: orderId,
      equipment_id: equipmentId,
      quantity: 1,
      rental_price: equipment.rental_price,
      deposit_amount: equipment.deposit_amount,
      is_extra: true,
    } as OrderEquipmentInsert)
    .select()
    .single()

  if (oeError) throw oeError
  const orderEquipment = orderEquipmentData as OrderEquipment | null

  await supabase
    .from('orders')
    .update({
      total_amount: order.total_amount + equipment.rental_price,
      deposit_amount: order.deposit_amount + equipment.deposit_amount,
    } as OrderUpdate)
    .eq('id', orderId)

  await supabase.from('deposit_transactions').insert({
    order_id: orderId,
    type: 'charge',
    amount: equipment.deposit_amount,
    notes: `临时添加器材: ${equipment.name}`,
    created_by: staffId,
  } as Database['public']['Tables']['deposit_transactions']['Insert'])

  const { data: customerData } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', order.customer_id)
    .single()
  const customer = customerData as Profile | null

  await createNotification({
    userId: order.customer_id,
    type: 'order_status',
    title: '订单已更新',
    content: `您的订单 ${order.order_number} 已添加器材 ${equipment.name}，需补交押金 ${equipment.deposit_amount} 元。`,
    relatedOrderId: orderId,
    sendEmail: !!customer?.email,
    recipientEmail: customer?.email,
    sendSms: !!customer?.phone,
    recipientPhone: customer?.phone,
    priority: 'high',
  })

  return orderEquipment
}

export async function pickupEquipment(orderEquipmentId: string, staffId: string) {
  const supabase = createClient()

  const { data: orderEquipmentData } = await supabase
    .from('order_equipment')
    .update({
      picked_up: true,
      picked_up_by: staffId,
      picked_up_at: new Date().toISOString(),
    } as OrderEquipmentUpdate)
    .eq('id', orderEquipmentId)
    .select()
    .single()
  const orderEquipment = orderEquipmentData as OrderEquipment | null

  if (orderEquipment) {
    await supabase
      .from('equipment')
      .update({ status: 'in_use' } as Database['public']['Tables']['equipment']['Update'])
      .eq('id', orderEquipment.equipment_id)
  }

  return orderEquipment
}

export async function returnEquipment(orderEquipmentId: string, staffId: string) {
  const supabase = createClient()

  const { data: orderEquipmentData } = await supabase
    .from('order_equipment')
    .update({
      returned: true,
      returned_by: staffId,
      returned_at: new Date().toISOString(),
    } as OrderEquipmentUpdate)
    .eq('id', orderEquipmentId)
    .select()
    .single()
  const orderEquipment = orderEquipmentData as OrderEquipment | null

  if (orderEquipment) {
    await supabase
      .from('equipment')
      .update({ status: 'available' } as Database['public']['Tables']['equipment']['Update'])
      .eq('id', orderEquipment.equipment_id)

    const { data: orderData } = await supabase
      .from('orders')
      .select('customer_id, order_number')
      .eq('id', orderEquipment.order_id)
      .single()
    const order = orderData as Order | null

    if (order) {
      const { data: customerData } = await supabase
        .from('profiles')
        .select('email, phone')
        .eq('id', order.customer_id)
        .single()
      const customer = customerData as Profile | null

      await createNotification({
        userId: order.customer_id,
        type: 'equipment_return',
        title: '器材已归还',
        content: `订单 ${order.order_number} 的器材已确认归还，请检查押金退还情况。`,
        relatedOrderId: orderEquipment.order_id,
        sendEmail: !!customer?.email,
        recipientEmail: customer?.email,
        sendSms: !!customer?.phone,
        recipientPhone: customer?.phone,
        priority: 'normal',
      })
    }
  }

  return orderEquipment
}

export async function createDamageRecord(params: CreateDamageRecordRequest) {
  const supabase = createClient()

  const { data: damageRecordData, error } = await supabase
    .from('damage_records')
    .insert({
      order_id: params.orderId,
      equipment_id: params.equipmentId,
      description: params.description,
      severity: params.severity,
      repair_cost: params.repairCost,
      responsible_party_id: params.responsiblePartyId,
      reported_by: params.reportedBy,
      photos: params.photos as any,
    } as DamageRecordInsert)
    .select()
    .single()

  if (error) throw error
  const damageRecord = damageRecordData as DamageRecord

  await supabase
    .from('equipment')
    .update({ status: 'damaged' } as Database['public']['Tables']['equipment']['Update'])
    .eq('id', params.equipmentId)

  const { data: orderData } = await supabase
    .from('orders')
    .select('customer_id, order_number')
    .eq('id', params.orderId)
    .single()
  const order = orderData as Order | null

  if (order) {
    const { data: customerData } = await supabase
      .from('profiles')
      .select('email, phone')
      .eq('id', order.customer_id)
      .single()
    const customer = customerData as Profile | null

    await createNotification({
      userId: order.customer_id,
      type: 'damage_report',
      title: '器材损坏报告',
      content: `订单 ${order.order_number} 有器材损坏报告，请及时联系工作人员处理。`,
      relatedOrderId: params.orderId,
      sendEmail: !!customer?.email,
      recipientEmail: customer?.email,
      sendSms: !!customer?.phone,
      recipientPhone: customer?.phone,
      priority: 'high',
    })
  }

  return damageRecord
}

export async function resolveDamageRecord(
  damageRecordId: string,
  resolvedBy: string,
  resolutionNotes: string
) {
  const supabase = createClient()

  const { data: damageRecordData } = await supabase
    .from('damage_records')
    .update({
      resolved: true,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes,
    } as DamageRecordUpdate)
    .eq('id', damageRecordId)
    .select()
    .single()

  return damageRecordData as DamageRecord
}

export async function getEquipmentList(options?: {
  category?: string
  status?: string
}): Promise<Array<Omit<Equipment, 'purchase_price'> & { purchase_price?: number | null }>> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  const profile = profileData as { role: string } | null
  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  let query = supabase
    .from('equipment')
    .select(isStaff ? '*' : 'id, name, category, description, rental_price, deposit_amount, status, serial_number, brand, model, purchase_date, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (options?.category && options.category !== 'all') {
    query = query.eq('category', options.category)
  }
  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status)
  }

  const { data } = await query
  return (data || []) as Array<Omit<Equipment, 'purchase_price'> & { purchase_price?: number | null }>
}

export async function getAvailableEquipment(): Promise<Array<Omit<Equipment, 'purchase_price'>>> {
  const supabase = createClient()

  const { data } = await supabase
    .from('equipment')
    .select('id, name, category, description, rental_price, deposit_amount, status, serial_number, brand, model, purchase_date, created_at, updated_at')
    .eq('status', 'available')
    .order('name')

  return (data || []) as Array<Omit<Equipment, 'purchase_price'>>
}

export async function getOrderDetail(orderId: string): Promise<OrderWithDetails | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const profile = profileData as { role: string } | null
  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  const equipmentFields = isStaff
    ? 'equipment:equipment(*)'
    : 'equipment:equipment(id, name, category, description, rental_price, deposit_amount, status, serial_number, brand, model, purchase_date, created_at, updated_at)'

  const { data: orderData, error } = await supabase
    .from('orders')
    .select(`
      *,
      studio:studios(*),
      customer:profiles(*),
      package:packages(*),
      order_equipment(*, ${equipmentFields}),
      deposit_transactions(*),
      damage_records(*, equipment:equipment(name), responsible_party:profiles(full_name)),
      contracts(*)
    `)
    .eq('id', orderId)
    .single()

  if (error) return null
  return orderData as unknown as OrderWithDetails
}

export async function getNewOrderData(): Promise<{
  studios: Array<{ id: string; name: string; hourly_rate: number; description: string | null }>
  packages: Array<{ id: string; name: string; base_price: number; studio_hours: number; description: string | null }>
  equipment: Array<Omit<Equipment, 'purchase_price'>>
}> {
  const supabase = createClient()

  const [{ data: studiosData }, { data: packagesData }, { data: equipmentData }] = await Promise.all([
    supabase.from('studios').select('id, name, hourly_rate, description').eq('is_active', true),
    supabase.from('packages').select('id, name, base_price, studio_hours, description').eq('is_active', true),
    supabase
      .from('equipment')
      .select('id, name, category, description, rental_price, deposit_amount, status, serial_number, brand, model, purchase_date, created_at, updated_at')
      .eq('status', 'available'),
  ])

  return {
    studios: (studiosData || []) as any[],
    packages: (packagesData || []) as any[],
    equipment: (equipmentData || []) as any[],
  }
}
