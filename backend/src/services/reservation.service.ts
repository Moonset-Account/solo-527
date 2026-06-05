import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../database/db';
import { Reservation, ReservationStatus, PriceType } from '../types';
import { calculatePrice } from '../utils/price';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

export const createReservationSchema = z.object({
  equipment_id: z.string().uuid('设备ID格式错误'),
  field_id: z.string().uuid('地块ID格式错误'),
  crop_type: z.string().min(1, '作物类型不能为空'),
  start_time: z.string().datetime('开始时间格式错误'),
  end_time: z.string().datetime('结束时间格式错误'),
  price_type: z.enum(['self_use', 'cooperative_subsidy', 'cross_village'], {
    errorMap: () => ({ message: '价格类型错误' })
  })
});

export class ReservationService {
  async getAll(filters?: {
    user_id?: string;
    equipment_id?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    let query = db('reservations')
      .join('users', 'reservations.user_id', 'users.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .select(
        'reservations.*',
        'users.name as user_name',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'fields.name as field_name',
        'fields.area as field_area'
      )
      .orderBy('reservations.start_time', 'desc');

    if (filters?.user_id) {
      query = query.where('reservations.user_id', filters.user_id);
    }
    if (filters?.equipment_id) {
      query = query.where('reservations.equipment_id', filters.equipment_id);
    }
    if (filters?.status) {
      query = query.where('reservations.status', filters.status);
    }
    if (filters?.start_date) {
      query = query.where('reservations.start_time', '>=', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.where('reservations.end_time', '<=', filters.end_date);
    }

    return await query;
  }

  async getById(id: string): Promise<any> {
    const reservation = await db('reservations')
      .join('users', 'reservations.user_id', 'users.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .select(
        'reservations.*',
        'users.name as user_name',
        'users.phone as user_phone',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'equipment.model as equipment_model',
        'fields.name as field_name',
        'fields.area as field_area',
        'fields.location as field_location',
        'fields.polygon_coords as field_coords'
      )
      .where('reservations.id', id)
      .first();

    if (reservation && reservation.field_coords) {
      reservation.field_coords = JSON.parse(reservation.field_coords);
    }

    return reservation;
  }

  async create(userId: string, data: z.infer<typeof createReservationSchema>, ipAddress: string = '127.0.0.1'): Promise<Reservation> {
    const validation = createReservationSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const equipment = await db('equipment').where({ id: data.equipment_id }).first();
    if (!equipment) {
      throw new Error('设备不存在');
    }
    if (equipment.status === 'broken' || equipment.status === 'maintenance') {
      throw new Error('设备当前不可用');
    }

    const field = await db('fields').where({ id: data.field_id }).first();
    if (!field) {
      throw new Error('地块不存在');
    }

    const startTime = dayjs(data.start_time);
    const endTime = dayjs(data.end_time);
    
    if (endTime.isBefore(startTime)) {
      throw new Error('结束时间不能早于开始时间');
    }
    if (startTime.isBefore(dayjs())) {
      throw new Error('不能预约过去的时间');
    }

    const hours = endTime.diff(startTime, 'hour', true);
    if (hours < 0.5) {
      throw new Error('预约时长至少30分钟');
    }

    const conflict = await this.checkConflict(data.equipment_id, data.start_time, data.end_time);
    
    const priceInfo = calculatePrice(hours, data.price_type, field.area);
    const id = uuidv4();

    let status: ReservationStatus = 'pending';
    let queuePosition: number | null = null;

    if (conflict) {
      const maxQueue = await db('reservation_queue')
        .join('reservations', 'reservation_queue.reservation_id', 'reservations.id')
        .where('reservations.equipment_id', data.equipment_id)
        .where('reservation_queue.status', 'waiting')
        .max('reservation_queue.priority as max_priority')
        .first();
      
      queuePosition = (maxQueue?.max_priority || 0) + 1;
      status = 'queued';
    }

    const reservation: Partial<Reservation> = {
      id,
      user_id: userId,
      equipment_id: data.equipment_id,
      field_id: data.field_id,
      crop_type: data.crop_type,
      start_time: data.start_time,
      end_time: data.end_time,
      status,
      price_type: data.price_type,
      estimated_price: priceInfo.totalAmount,
      is_cancelled: false,
      is_rain_cancel: false,
      queue_position: queuePosition,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('reservations').insert(reservation);

    if (status === 'queued') {
      await db('reservation_queue').insert({
        id: uuidv4(),
        reservation_id: id,
        priority: queuePosition,
        status: 'waiting',
        queued_at: new Date().toISOString()
      });
    }

    await logAudit(userId, 'create_reservation', 'reservation', id, null, reservation, ipAddress);

    return reservation as Reservation;
  }

  async checkConflict(equipmentId: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
    let query = db('reservations')
      .where('equipment_id', equipmentId)
      .where('status', 'in', ['pending', 'confirmed', 'in_progress'])
      .where('is_cancelled', false)
      .where(function() {
        this.where(function() {
          this.where('start_time', '<', endTime)
            .where('end_time', '>', startTime);
        });
      });

    if (excludeId) {
      query = query.whereNot('id', excludeId);
    }

    const count = await query.count('id as count').first();
    return (count as any).count > 0;
  }

  async cancel(id: string, userId: string, reason: string, isRainCancel: boolean = false, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const reservation = await db('reservations').where({ id }).first();
    if (!reservation) {
      throw new Error('预约不存在');
    }

    if (reservation.status === 'completed' || reservation.status === 'in_progress') {
      throw new Error('该预约状态无法取消');
    }

    const beforeData = { ...reservation };

    await db('reservations')
      .where({ id })
      .update({
        status: 'cancelled',
        is_cancelled: true,
        cancel_reason: reason,
        is_rain_cancel: isRainCancel,
        updated_at: new Date().toISOString()
      });

    await db('reservation_queue')
      .where({ reservation_id: id })
      .update({ status: 'cancelled' });

    await this.promoteQueue(reservation.equipment_id);

    if (!isRainCancel && reservation.status !== 'queued') {
      const pointsToDeduct = 10;
      await db('users')
        .where({ id: reservation.user_id })
        .decrement('points', pointsToDeduct);
    }

    await logAudit(userId, 'cancel_reservation', 'reservation', id, beforeData, {
      status: 'cancelled',
      cancel_reason: reason
    }, ipAddress);

    return true;
  }

  private async promoteQueue(equipmentId: string): Promise<void> {
    const queueItems = await db('reservation_queue')
      .join('reservations', 'reservation_queue.reservation_id', 'reservations.id')
      .where('reservations.equipment_id', equipmentId)
      .where('reservation_queue.status', 'waiting')
      .orderBy('reservation_queue.priority', 'asc')
      .select('reservation_queue.*', 'reservations.start_time', 'reservations.end_time');

    for (const item of queueItems) {
      const hasConflict = await this.checkConflict(
        equipmentId,
        item.start_time,
        item.end_time,
        item.reservation_id
      );

      if (!hasConflict) {
        await db('reservations')
          .where({ id: item.reservation_id })
          .update({
            status: 'pending',
            queue_position: null,
            updated_at: new Date().toISOString()
          });

        await db('reservation_queue')
          .where({ id: item.id })
          .update({ status: 'promoted' });

        break;
      }
    }
  }

  async confirm(id: string, operatorId: string, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const reservation = await db('reservations').where({ id }).first();
    if (!reservation) {
      throw new Error('预约不存在');
    }

    if (reservation.status !== 'pending') {
      throw new Error('只有待确认的预约可以接单');
    }

    const beforeData = { ...reservation };

    await db('reservations')
      .where({ id })
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      });

    const workOrderId = uuidv4();
    await db('work_orders').insert({
      id: workOrderId,
      reservation_id: id,
      operator_id: operatorId,
      status: 'assigned',
      assigned_at: new Date().toISOString()
    });

    await db('equipment')
      .where({ id: reservation.equipment_id })
      .update({ status: 'in_use' });

    await logAudit(operatorId, 'confirm_reservation', 'reservation', id, beforeData, {
      status: 'confirmed',
      work_order_id: workOrderId
    }, ipAddress);

    return true;
  }

  async checkRainAndCancel(): Promise<void> {
    const rainProbability = Math.random();
    
    if (rainProbability > 0.7) {
      const tomorrowStart = dayjs().add(1, 'day').startOf('day').toISOString();
      const tomorrowEnd = dayjs().add(1, 'day').endOf('day').toISOString();

      const reservations = await db('reservations')
        .where('start_time', '>=', tomorrowStart)
        .where('start_time', '<=', tomorrowEnd)
        .where('status', 'in', ['pending', 'confirmed'])
        .where('is_cancelled', false)
        .select('id', 'user_id');

      for (const res of reservations) {
        await this.cancel(res.id, res.user_id, '雨天自动取消', true);
      }

      console.log(`雨天自动取消了 ${reservations.length} 个预约`);
    }
  }
}
