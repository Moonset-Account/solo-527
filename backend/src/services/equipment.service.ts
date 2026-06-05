import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { Equipment, EquipmentStatus, EquipmentType } from '../types';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

export const createEquipmentSchema = z.object({
  name: z.string().min(2, '设备名称至少2个字符'),
  type: z.enum(['tractor', 'transplanter', 'drone', 'other']),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().optional(),
  status: z.enum(['available', 'in_use', 'maintenance', 'broken']).default('available')
});

export class EquipmentService {
  async getAll(filters?: {
    type?: EquipmentType;
    status?: EquipmentStatus;
    keyword?: string;
  }): Promise<Equipment[]> {
    let query = db('equipment').select('*').orderBy('created_at', 'desc');

    if (filters?.type) {
      query = query.where('type', filters.type);
    }
    if (filters?.status) {
      query = query.where('status', filters.status);
    }
    if (filters?.keyword) {
      query = query.where(function() {
        this.where('name', 'like', `%${filters.keyword}%`)
          .orWhere('model', 'like', `%${filters.keyword}%`);
      });
    }

    return await query;
  }

  async getById(id: string): Promise<any> {
    const equipment = await db('equipment').where({ id }).first();
    if (!equipment) return null;

    const maintenanceRecords = await db('maintenance_tickets')
      .where({ equipment_id: id })
      .orderBy('reported_at', 'desc')
      .limit(10);

    const workRecords = await db('work_records')
      .join('fields', 'work_records.field_id', 'fields.id')
      .join('users', 'work_records.operator_id', 'users.id')
      .where('work_records.equipment_id', id)
      .select(
        'work_records.*',
        'fields.name as field_name',
        'users.name as operator_name'
      )
      .orderBy('work_records.completed_at', 'desc')
      .limit(20);

    const totalFuel = workRecords.reduce((sum, r) => sum + (r.fuel_consumption || 0), 0);
    const totalWorkHours = workRecords.reduce((sum, r) => sum + (r.work_hours || 0), 0);

    return {
      ...equipment,
      maintenance_records: maintenanceRecords,
      work_records: workRecords,
      stats: {
        total_fuel: totalFuel,
        total_work_hours: totalWorkHours,
        maintenance_count: maintenanceRecords.filter(m => m.status !== 'closed').length
      }
    };
  }

  async create(userId: string, data: z.infer<typeof createEquipmentSchema>, ipAddress: string = '127.0.0.1'): Promise<Equipment> {
    const validation = createEquipmentSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const id = uuidv4();
    const equipment: Partial<Equipment> = {
      id,
      ...data,
      total_hours: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db('equipment').insert(equipment);
    await logAudit(userId, 'create_equipment', 'equipment', id, null, equipment, ipAddress);

    return equipment as Equipment;
  }

  async updateStatus(id: string, userId: string, status: EquipmentStatus, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const equipment = await db('equipment').where({ id }).first();
    if (!equipment) {
      throw new Error('设备不存在');
    }

    const beforeData = { ...equipment };

    await db('equipment')
      .where({ id })
      .update({
        status,
        updated_at: new Date().toISOString()
      });

    if (status === 'broken') {
      const pendingReservations = await db('reservations')
        .where({ equipment_id: id })
        .where('status', 'in', ['pending', 'confirmed'])
        .where('is_cancelled', false)
        .select('id', 'user_id');

      const { ReservationService } = await import('./reservation.service');
      const reservationService = new ReservationService();
      
      for (const res of pendingReservations) {
        await reservationService.cancel(res.id, userId, '设备故障，自动取消', false, ipAddress);
      }
    }

    await logAudit(userId, 'update_equipment_status', 'equipment', id, beforeData, { status }, ipAddress);
    return true;
  }

  async getStatistics(): Promise<any> {
    const total = await db('equipment').count('id as count').first();
    const available = await db('equipment').where('status', 'available').count('id as count').first();
    const inUse = await db('equipment').where('status', 'in_use').count('id as count').first();
    const maintenance = await db('equipment').where('status', 'maintenance').count('id as count').first();
    const broken = await db('equipment').where('status', 'broken').count('id as count').first();

    return {
      total: (total as any).count,
      available: (available as any).count,
      in_use: (inUse as any).count,
      maintenance: (maintenance as any).count,
      broken: (broken as any).count
    };
  }
}
