import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';
import { logAudit } from '../utils/audit';
import { z } from 'zod';
import { ReservationService } from './reservation.service';

export const createTicketSchema = z.object({
  equipment_id: z.string().min(1, '设备ID不能为空'),
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字符'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
});

export const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  description: z.string().optional(),
  cost: z.number().min(0).optional(),
  resolution_notes: z.string().optional()
});

export class MaintenanceService {
  async getAll(filters?: {
    equipment_id?: string;
    status?: string;
    priority?: string;
    reported_by?: string;
  }): Promise<any[]> {
    let query = db('maintenance_tickets')
      .join('equipment', 'maintenance_tickets.equipment_id', 'equipment.id')
      .join('users as reporters', 'maintenance_tickets.reported_by', 'reporters.id')
      .select(
        'maintenance_tickets.*',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'equipment.status as equipment_status',
        'reporters.name as reporter_name'
      )
      .orderBy('maintenance_tickets.reported_at', 'desc');

    if (filters?.equipment_id) {
      query = query.where('maintenance_tickets.equipment_id', filters.equipment_id);
    }
    if (filters?.status) {
      query = query.where('maintenance_tickets.status', filters.status);
    }
    if (filters?.priority) {
      query = query.where('maintenance_tickets.priority', filters.priority);
    }
    if (filters?.reported_by) {
      query = query.where('maintenance_tickets.reported_by', filters.reported_by);
    }

    return await query;
  }

  async getById(id: string): Promise<any> {
    const ticket = await db('maintenance_tickets')
      .join('equipment', 'maintenance_tickets.equipment_id', 'equipment.id')
      .join('users as reporters', 'maintenance_tickets.reported_by', 'reporters.id')
      .select(
        'maintenance_tickets.*',
        'equipment.name as equipment_name',
        'equipment.type as equipment_type',
        'equipment.status as equipment_status',
        'reporters.name as reporter_name'
      )
      .where('maintenance_tickets.id', id)
      .first();

    return ticket;
  }

  async create(
    userId: string, 
    data: z.infer<typeof createTicketSchema>, 
    ipAddress: string = '127.0.0.1'
  ): Promise<any> {
    const validation = createTicketSchema.safeParse(data);
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
      description: data.description || null,
      priority: data.priority,
      status: 'open' as const,
      cost: 0,
      reported_at: new Date()
    };

    const trx = await db.transaction();

    try {
      await trx('maintenance_tickets').insert(ticket);

      if (data.priority === 'critical' || data.priority === 'high') {
        const reservationService = new ReservationService();
        const rescheduledIds = await reservationService.handleEquipmentBreakdown(
          data.equipment_id,
          id,
          userId,
          ipAddress
        );

        await trx('maintenance_tickets')
          .where({ id })
          .update({
            affected_reservation_ids: rescheduledIds.join(',')
          });
      }

      await trx.commit();

      await logAudit(
        userId,
        'create',
        'maintenance',
        id,
        null,
        ticket,
        ipAddress
      );

      return { ...ticket, equipment_name: equipment.name };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async update(
    id: string,
    userId: string,
    data: z.infer<typeof updateTicketSchema>,
    ipAddress: string = '127.0.0.1'
  ): Promise<boolean> {
    const validation = updateTicketSchema.safeParse(data);
    if (!validation.success) {
      throw new Error(validation.error.errors[0].message);
    }

    const ticket = await this.getById(id);
    if (!ticket) {
      throw new Error('工单不存在');
    }

    const beforeData = { ...ticket };
    const updateData: any = { ...data };

    if (data.status === 'resolved' && ticket.status !== 'resolved') {
      updateData.resolved_at = new Date();
      
      await db('equipment')
        .where({ id: ticket.equipment_id })
        .update({ status: 'available' });

      const reservationService = new ReservationService();
      await reservationService.promoteWaitlist(ticket.equipment_id);
    }

    if (data.status === 'in_progress' && ticket.status === 'open') {
      await db('equipment')
        .where({ id: ticket.equipment_id })
        .update({ status: 'maintenance' });
    }

    await db('maintenance_tickets')
      .where({ id })
      .update(updateData);

    await logAudit(
      userId,
      'update',
      'maintenance',
      id,
      beforeData,
      updateData,
      ipAddress
    );

    return true;
  }
}
