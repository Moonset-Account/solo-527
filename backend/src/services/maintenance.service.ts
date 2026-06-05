import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { logAudit } from '../utils/audit';
import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  equipment_id: z.string().uuid('设备ID格式错误'),
  title: z.string().min(5, '标题至少5个字符'),
  description: z.string().optional()
});

export class MaintenanceService {
  async getAll(filters?: {
    equipment_id?: string;
    status?: string;
  }): Promise<any[]> {
    let query = db('maintenance_tickets')
      .join('equipment', 'maintenance_tickets.equipment_id', 'equipment.id')
      .join('users as reporter', 'maintenance_tickets.reported_by', 'reporter.id')
      .select(
        'maintenance_tickets.*',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'reporter.name as reporter_name'
      )
      .orderBy('maintenance_tickets.reported_at', 'desc');

    if (filters?.equipment_id) {
      query = query.where('maintenance_tickets.equipment_id', filters.equipment_id);
    }
    if (filters?.status) {
      query = query.where('maintenance_tickets.status', filters.status);
    }

    return await query;
  }

  async create(userId: string, data: z.infer<typeof createMaintenanceSchema>, ipAddress: string = '127.0.0.1'): Promise<any> {
    const validation = createMaintenanceSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const equipment = await db('equipment').where({ id: data.equipment_id }).first();
    if (!equipment) {
      throw new Error('设备不存在');
    }

    const id = uuidv4();
    const ticket = {
      id,
      equipment_id: data.equipment_id,
      reported_by: userId,
      title: data.title,
      description: data.description || '',
      status: 'open' as const,
      cost: 0,
      reported_at: new Date().toISOString()
    };

    await db('maintenance_tickets').insert(ticket);

    const { EquipmentService } = await import('./equipment.service');
    const equipmentService = new EquipmentService();
    await equipmentService.updateStatus(data.equipment_id, userId, 'maintenance', ipAddress);

    await logAudit(userId, 'create_maintenance', 'maintenance', id, null, ticket, ipAddress);

    return ticket;
  }

  async updateStatus(id: string, userId: string, status: string, cost: number = 0, ipAddress: string = '127.0.0.1'): Promise<boolean> {
    const ticket = await db('maintenance_tickets').where({ id }).first();
    if (!ticket) {
      throw new Error('工单不存在');
    }

    const beforeData = { ...ticket };

    const updateData: any = { status };
    if (cost > 0) {
      updateData.cost = cost;
    }
    if (status === 'resolved' || status === 'closed') {
      updateData.resolved_at = new Date().toISOString();
    }

    await db('maintenance_tickets').where({ id }).update(updateData);

    if (status === 'resolved' || status === 'closed') {
      const hasOpenMaintenance = await db('maintenance_tickets')
        .where({ equipment_id: ticket.equipment_id })
        .where('status', 'in', ['open', 'in_progress'])
        .count('id as count')
        .first();

      if ((hasOpenMaintenance as any).count === 0) {
        const { EquipmentService } = await import('./equipment.service');
        const equipmentService = new EquipmentService();
        await equipmentService.updateStatus(ticket.equipment_id, userId, 'available', ipAddress);
      }
    }

    await logAudit(userId, 'update_maintenance_status', 'maintenance', id, beforeData, { status, cost }, ipAddress);

    return true;
  }
}
