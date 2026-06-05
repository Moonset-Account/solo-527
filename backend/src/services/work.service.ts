import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { logAudit } from '../utils/audit';
import { calculatePrice } from '../utils/price';
import dayjs from 'dayjs';
import { z } from 'zod';

export const completeWorkSchema = z.object({
  fuel_consumption: z.number().min(0, '油耗不能为负数'),
  work_hours: z.number().min(0.5, '工作时长至少30分钟'),
  photos: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export class WorkService {
  async getMyOrders(operatorId: string): Promise<any[]> {
    return await db('work_orders')
      .join('reservations', 'work_orders.reservation_id', 'reservations.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .join('users as member', 'reservations.user_id', 'member.id')
      .select(
        'work_orders.*',
        'reservations.crop_type',
        'reservations.start_time',
        'reservations.end_time',
        'reservations.price_type',
        'reservations.estimated_price',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'fields.name as field_name',
        'fields.area as field_area',
        'fields.location as field_location',
        'member.name as member_name',
        'member.phone as member_phone'
      )
      .where('work_orders.operator_id', operatorId)
      .orderBy('work_orders.assigned_at', 'desc');
  }

  async acceptOrder(orderId: string, operatorId: string, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const order = await db('work_orders').where({ id: orderId }).first();
    if (!order) {
      throw new Error('工单不存在');
    }
    if (order.operator_id !== operatorId) {
      throw new Error('无权操作此工单');
    }
    if (order.status !== 'assigned') {
      throw new Error('工单状态不允许接受');
    }

    const beforeData = { ...order };

    await db('work_orders')
      .where({ id: orderId })
      .update({ status: 'accepted' });

    await db('reservations')
      .where({ id: order.reservation_id })
      .update({ status: 'in_progress' });

    await logAudit(operatorId, 'accept_work_order', 'work_order', orderId, beforeData, { status: 'accepted' }, ipAddress);
    return true;
  }

  async completeWork(orderId: string, operatorId: string, data: z.infer<typeof completeWorkSchema>, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const validation = completeWorkSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const order = await db('work_orders').where({ id: orderId }).first();
    if (!order) {
      throw new Error('工单不存在');
    }
    if (order.operator_id !== operatorId) {
      throw new Error('无权操作此工单');
    }
    if (order.status !== 'accepted' && order.status !== 'in_progress') {
      throw new Error('工单状态不允许完成');
    }

    const reservation = await db('reservations').where({ id: order.reservation_id }).first();

    const recordId = uuidv4();
    await db('work_records').insert({
      id: recordId,
      reservation_id: order.reservation_id,
      equipment_id: reservation.equipment_id,
      field_id: reservation.field_id,
      operator_id: operatorId,
      fuel_consumption: data.fuel_consumption,
      work_hours: data.work_hours,
      photos: JSON.stringify(data.photos),
      notes: data.notes,
      completed_at: new Date().toISOString()
    });

    const hours = data.work_hours;
    const priceInfo = calculatePrice(hours, reservation.price_type);

    const settlementId = uuidv4();
    await db('settlements').insert({
      id: settlementId,
      reservation_id: order.reservation_id,
      user_id: reservation.user_id,
      price_type: reservation.price_type,
      base_price: priceInfo.basePrice,
      subsidy_amount: priceInfo.subsidyAmount,
      total_amount: priceInfo.totalAmount,
      points_deducted: 0,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    await db('work_orders')
      .where({ id: orderId })
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      });

    await db('reservations')
      .where({ id: order.reservation_id })
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      });

    await db('equipment')
      .where({ id: reservation.equipment_id })
      .update({
        status: 'available',
        total_hours: db.raw('total_hours + ?', [data.work_hours])
      });

    await logAudit(operatorId, 'complete_work', 'work_record', recordId, null, {
      work_order_id: orderId,
      ...data,
      settlement_id: settlementId
    }, ipAddress);

    return true;
  }

  async updateRoute(orderId: string, operatorId: string, routeInfo: any, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const order = await db('work_orders').where({ id: orderId }).first();
    if (!order) {
      throw new Error('工单不存在');
    }
    if (order.operator_id !== operatorId) {
      throw new Error('无权操作此工单');
    }

    const beforeData = { ...order };

    await db('work_orders')
      .where({ id: orderId })
      .update({
        route_info: JSON.stringify(routeInfo),
        status: 'in_progress'
      });

    await logAudit(operatorId, 'update_route', 'work_order', orderId, beforeData, { route_info: routeInfo }, ipAddress);
    return true;
  }
}
