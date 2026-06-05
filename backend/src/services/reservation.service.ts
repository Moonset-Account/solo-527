import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { db } from '../database/db';
import { calculatePrice } from '../utils/price';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

export const createReservationSchema = z.object({
  equipment_id: z.string().min(1, '设备ID不能为空'),
  field_id: z.string().min(1, '地块ID不能为空'),
  crop: z.string().min(1, '作物类型不能为空'),
  start_time: z.string().min(1, '开始时间不能为空'),
  end_time: z.string().min(1, '结束时间不能为空'),
  price_type: z.enum(['member', 'subsidy', 'commercial'], {
    errorMap: () => ({ message: '价格类型必须是 member、subsidy 或 commercial' })
  }),
  notes: z.string().optional()
});

export const checkConflictSchema = z.object({
  equipment_id: z.string().min(1, '设备ID不能为空'),
  start_time: z.string().min(1, '开始时间不能为空'),
  end_time: z.string().min(1, '结束时间不能为空')
});

export class ReservationService {
  async getAll(filters?: {
    member_id?: string;
    equipment_id?: string;
    status?: string;
    date?: string;
  }): Promise<any[]> {
    let query = db('reservations')
      .join('users as members', 'reservations.member_id', 'members.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .leftJoin('work_orders', 'reservations.id', 'work_orders.reservation_id')
      .leftJoin('users as operators', 'work_orders.operator_id', 'operators.id')
      .select(
        'reservations.*',
        'members.name as member_name',
        'members.phone as member_phone',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'equipment.status as equipment_status',
        'fields.name as field_name',
        'fields.area as field_area',
        'operators.name as operator_name'
      )
      .orderBy('reservations.created_at', 'desc');

    if (filters?.member_id) {
      query = query.where('reservations.member_id', filters.member_id);
    }
    if (filters?.equipment_id) {
      query = query.where('reservations.equipment_id', filters.equipment_id);
    }
    if (filters?.status) {
      query = query.where('reservations.status', filters.status);
    }
    if (filters?.date) {
      const dateStart = dayjs(filters.date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const dateEnd = dayjs(filters.date).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      query = query.whereBetween('reservations.start_time', [dateStart, dateEnd]);
    }

    const results = await query;
    return results.map(r => ({
      ...r,
      is_conflict: false
    }));
  }

  async getById(id: string): Promise<any> {
    const reservation = await db('reservations')
      .join('users as members', 'reservations.member_id', 'members.id')
      .join('equipment', 'reservations.equipment_id', 'equipment.id')
      .join('fields', 'reservations.field_id', 'fields.id')
      .leftJoin('work_orders', 'reservations.id', 'work_orders.reservation_id')
      .leftJoin('users as operators', 'work_orders.operator_id', 'operators.id')
      .select(
        'reservations.*',
        'members.name as member_name',
        'members.phone as member_phone',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'equipment.model as equipment_model',
        'fields.name as field_name',
        'fields.area as field_area',
        'fields.location as field_location',
        'fields.polygon_coords as field_coords',
        'operators.name as operator_name'
      )
      .where('reservations.id', id)
      .first();

    if (reservation && reservation.field_coords) {
      try {
        reservation.field_coords = JSON.parse(reservation.field_coords);
      } catch (e) {}
    }

    return reservation;
  }

  async create(
    memberId: string, 
    data: z.infer<typeof createReservationSchema>, 
    ipAddress: string = '127.0.0.1',
    userAgent: string = ''
  ): Promise<any> {
    const validation = createReservationSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const equipment = await db('equipment').where({ id: data.equipment_id }).first();
    if (!equipment) {
      throw new Error('设备不存在');
    }
    if (equipment.status === 'broken' || equipment.status === 'maintenance') {
      throw new Error('设备当前不可用（故障或维修中）');
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

    const hasConflict = await this.checkConflict(data.equipment_id, data.start_time, data.end_time);
    const priceInfo = calculatePrice(hours, data.price_type, parseFloat(field.area));
    const id = uuidv4();

    let status: string = 'pending';
    let queuePosition: number | null = null;

    if (hasConflict) {
      const maxQueue = await db('reservation_queue')
        .where('equipment_id', data.equipment_id)
        .where('status', 'waiting')
        .max('priority as max_priority')
        .first();
      
      queuePosition = (maxQueue?.max_priority || 0) + 1;
      status = 'waitlisted';
    }

    const reservation = {
      id,
      member_id: memberId,
      equipment_id: data.equipment_id,
      field_id: data.field_id,
      crop: data.crop,
      start_time: data.start_time,
      end_time: data.end_time,
      status,
      price_type: data.price_type,
      estimated_price: priceInfo.totalAmount,
      cancel_reason: null,
      is_rain_cancel: false,
      queue_position: queuePosition,
      notes: data.notes || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db('reservations').insert(reservation);

    if (status === 'waitlisted') {
      await db('reservation_queue').insert({
        id: uuidv4(),
        reservation_id: id,
        equipment_id: data.equipment_id,
        target_start_time: data.start_time,
        target_end_time: data.end_time,
        priority: queuePosition,
        status: 'waiting',
        queued_at: new Date()
      });
    }

    await logAudit(
      memberId, 
      status === 'waitlisted' ? 'create_waitlisted' : 'create', 
      'reservation', 
      id, 
      null, 
      reservation, 
      ipAddress,
      userAgent
    );

    return {
      ...reservation,
      is_waitlisted: status === 'waitlisted',
      queue_position: queuePosition
    };
  }

  async checkConflict(equipmentId: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
    let query = db('reservations')
      .where('equipment_id', equipmentId)
      .where('status', 'in', ['pending', 'confirmed', 'in_progress'])
      .where(function() {
        this.where('start_time', '<', endTime)
          .where('end_time', '>', startTime);
      });

    if (excludeId) {
      query = query.whereNot('id', excludeId);
    }

    const count = await query.count('id as count').first();
    return (count as any).count > 0;
  }

  async cancel(
    id: string, 
    userId: string, 
    reason: string, 
    isRainCancel: boolean = false, 
    ipAddress: string = '127.0.0.1',
    userAgent: string = ''
  ): Promise<boolean> {
    const reservation = await db('reservations').where({ id }).first();
    if (!reservation) {
      throw new Error('预约不存在');
    }

    if (reservation.status === 'completed' || reservation.status === 'in_progress') {
      throw new Error('作业中的预约无法取消');
    }

    const beforeData = { ...reservation };

    await db('reservations')
      .where({ id })
      .update({
        status: 'cancelled',
        cancel_reason: reason,
        is_rain_cancel: isRainCancel,
        updated_at: new Date()
      });

    await db('reservation_queue')
      .where({ reservation_id: id })
      .update({ status: 'cancelled' });

    if (reservation.status === 'confirmed') {
      await db('equipment')
        .where({ id: reservation.equipment_id })
        .update({ status: 'available' });
    }

    await this.promoteWaitlist(reservation.equipment_id);

    if (!isRainCancel && reservation.status !== 'waitlisted') {
      const pointsToDeduct = 10;
      await db('users')
        .where({ id: reservation.member_id })
        .decrement('points', pointsToDeduct);
    }

    await logAudit(
      userId, 
      isRainCancel ? 'rain_cancel' : 'cancel', 
      'reservation', 
      id, 
      beforeData, 
      { status: 'cancelled', cancel_reason: reason },
      ipAddress,
      userAgent
    );

    return true;
  }

  async resubmit(
    id: string,
    userId: string,
    data: Partial<z.infer<typeof createReservationSchema>>,
    ipAddress: string = '127.0.0.1',
    userAgent: string = ''
  ): Promise<any> {
    const original = await db('reservations').where({ id }).first();
    if (!original) {
      throw new Error('原预约不存在');
    }
    if (original.status !== 'cancelled') {
      throw new Error('只有已取消的预约可以重新提交');
    }

    const newData = {
      equipment_id: data.equipment_id || original.equipment_id,
      field_id: data.field_id || original.field_id,
      crop: data.crop || original.crop,
      start_time: data.start_time || original.start_time,
      end_time: data.end_time || original.end_time,
      price_type: data.price_type || original.price_type,
      notes: data.notes || original.notes
    };

    const newReservation = await this.create(userId, newData as any, ipAddress, userAgent);

    await db('reservations')
      .where({ id: newReservation.id })
      .update({ original_reservation_id: id });

    await logAudit(
      userId,
      'resubmit',
      'reservation',
      newReservation.id,
      { original_id: id },
      newReservation,
      ipAddress,
      userAgent
    );

    return newReservation;
  }

  async promoteWaitlist(equipmentId: string): Promise<string[]> {
    const promotedIds: string[] = [];
    
    const queueItems = await db('reservation_queue')
      .join('reservations', 'reservation_queue.reservation_id', 'reservations.id')
      .where('reservation_queue.equipment_id', equipmentId)
      .where('reservation_queue.status', 'waiting')
      .orderBy('reservation_queue.priority', 'asc')
      .select('reservation_queue.*', 'reservations.start_time', 'reservations.end_time', 'reservations.member_id');

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
            updated_at: new Date()
          });

        await db('reservation_queue')
          .where({ id: item.id })
          .update({ 
            status: 'promoted',
            promoted_at: new Date()
          });

        promotedIds.push(item.reservation_id);
        break;
      }
    }

    return promotedIds;
  }

  async confirm(id: string, operatorId: string, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const reservation = await db('reservations').where({ id }).first();
    if (!reservation) {
      throw new Error('预约不存在');
    }

    if (reservation.status !== 'pending') {
      throw new Error('只有待确认的预约可以确认');
    }

    const hasConflict = await this.checkConflict(
      reservation.equipment_id, 
      reservation.start_time, 
      reservation.end_time, 
      id
    );
    
    if (hasConflict) {
      throw new Error('该时段存在冲突，无法确认，请调整时间');
    }

    const beforeData = { ...reservation };

    await db('reservations')
      .where({ id })
      .update({
        status: 'confirmed',
        updated_at: new Date()
      });

    const workOrderId = uuidv4();
    await db('work_orders').insert({
      id: workOrderId,
      reservation_id: id,
      operator_id: operatorId,
      status: 'assigned',
      assigned_at: new Date()
    });

    await db('equipment')
      .where({ id: reservation.equipment_id })
      .update({ status: 'in_use' });

    await logAudit(
      operatorId, 
      'confirm', 
      'reservation', 
      id, 
      beforeData, 
      { status: 'confirmed', work_order_id: workOrderId },
      ipAddress
    );

    return true;
  }

  async handleEquipmentBreakdown(
    equipmentId: string, 
    maintenanceTicketId: string,
    operatorId: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<string[]> {
    const affectedReservations = await db('reservations')
      .where('equipment_id', equipmentId)
      .where('status', 'in', ['confirmed', 'in_progress'])
      .select('id', 'member_id', 'start_time', 'end_time');

    const rescheduledIds: string[] = [];

    for (const res of affectedReservations) {
      const beforeData = { ...res };
      
      await db('reservations')
        .where({ id: res.id })
        .update({
          status: 'waitlisted',
          queue_position: 999,
          updated_at: new Date()
        });

      const nextAvailable = await this.findNextAvailableSlot(equipmentId, res.start_time);
      
      if (nextAvailable) {
        await db('reservations')
          .where({ id: res.id })
          .update({
            start_time: nextAvailable.startTime,
            end_time: nextAvailable.endTime
          });

        await db('reservation_queue').insert({
          id: uuidv4(),
          reservation_id: res.id,
          equipment_id: equipmentId,
          target_start_time: nextAvailable.startTime,
          target_end_time: nextAvailable.endTime,
          priority: 1,
          status: 'waiting',
          queued_at: new Date()
        });

        rescheduledIds.push(res.id);
      }

      await logAudit(
        operatorId,
        'breakdown_reschedule',
        'reservation',
        res.id,
        beforeData,
        { 
          status: 'waitlisted', 
          reason: 'equipment_breakdown',
          maintenance_ticket_id: maintenanceTicketId,
          new_start_time: nextAvailable?.startTime
        },
        ipAddress
      );
    }

    await db('equipment')
      .where({ id: equipmentId })
      .update({ status: 'maintenance' });

    return rescheduledIds;
  }

  private async findNextAvailableSlot(
    equipmentId: string, 
    fromTime: string
  ): Promise<{ startTime: string; endTime: string } | null> {
    const duration = 4;
    let checkStart = dayjs(fromTime).add(1, 'day').startOf('hour');
    
    for (let i = 0; i < 30; i++) {
      const candidateStart = checkStart.add(i * 4, 'hour');
      const candidateEnd = candidateStart.add(duration, 'hour');
      
      const hasConflict = await this.checkConflict(
        equipmentId,
        candidateStart.format('YYYY-MM-DD HH:mm:ss'),
        candidateEnd.format('YYYY-MM-DD HH:mm:ss')
      );
      
      if (!hasConflict) {
        return {
          startTime: candidateStart.format('YYYY-MM-DD HH:mm:ss'),
          endTime: candidateEnd.format('YYYY-MM-DD HH:mm:ss')
        };
      }
    }
    
    return null;
  }

  async checkRainAndCancel(): Promise<void> {
    const rainProbability = Math.random();
    
    if (rainProbability > 0.7) {
      const tomorrowStart = dayjs().add(1, 'day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
      const tomorrowEnd = dayjs().add(1, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss');

      const reservations = await db('reservations')
        .where('start_time', '>=', tomorrowStart)
        .where('start_time', '<=', tomorrowEnd)
        .where('status', 'in', ['pending', 'confirmed'])
        .select('id', 'member_id');

      for (const res of reservations) {
        try {
          await this.cancel(res.id, res.member_id, '雨天自动取消', true);
        } catch (e) {
          console.error('取消预约失败:', res.id, e);
        }
      }

      console.log(`🌧️ 雨天自动取消了 ${reservations.length} 个预约`);
    }
  }
}
