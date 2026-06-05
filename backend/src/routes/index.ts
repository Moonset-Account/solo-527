import { FastifyInstance } from 'fastify';
import { EquipmentService } from '../services/equipment.service';
import { ReservationService, createReservationSchema, checkConflictSchema } from '../services/reservation.service';
import { WorkService, completeWorkSchema } from '../services/work.service';
import { MaintenanceService, createTicketSchema, updateTicketSchema } from '../services/maintenance.service';
import { SettlementService } from '../services/settlement.service';
import { AuditService } from '../services/audit.service';
import { FieldService } from '../services/field.service';
import { authenticate, getClientIp } from '../middleware/auth';
import { config } from '../config';

import { AuthService } from '../services/auth.service';

const equipmentService = new EquipmentService();
const reservationService = new ReservationService();
const workService = new WorkService();
const maintenanceService = new MaintenanceService();
const settlementService = new SettlementService();
const auditService = new AuditService();
const fieldService = new FieldService();

export async function routes(fastify: FastifyInstance) {
  fastify.get('/api/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const authService = new AuthService();
      const { username, password } = request.body as any;
      const ip = getClientIp(request);
      const userAgent = request.headers['user-agent'] || '';
      const result = await authService.login(username, password, ip, userAgent);
      
      if (!result) {
        return reply.status(401).send({ error: '用户名或密码错误' });
      }
      
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/auth/me', { preHandler: authenticate() as any }, async (request: any, reply) => {
    const authService = new AuthService();
    const user = await authService.getCurrentUser(request.user.id);
    if (!user) {
      return reply.status(404).send({ error: '用户不存在' });
    }
    return user;
  });

  fastify.post('/api/auth/logout', { preHandler: authenticate() as any }, async (request: any) => {
    const authService = new AuthService();
    const ip = getClientIp(request);
    const userAgent = request.headers['user-agent'] || '';
    await authService.logout(request.user.id, ip, userAgent);
    return { success: true };
  });

  fastify.get('/api/equipment', { preHandler: authenticate() as any }, async (request: any) => {
    const query = request.query as any;
    return await equipmentService.getAll({
      type: query.type,
      status: query.status,
      keyword: query.keyword
    });
  });

  fastify.get('/api/equipment/:id', { preHandler: authenticate() as any }, async (request: any, reply: any) => {
    const { id } = request.params as any;
    const equipment = await equipmentService.getById(id);
    if (!equipment) {
      return reply.status(404).send({ error: '设备不存在' });
    }
    return equipment;
  });

  fastify.get('/api/equipment/stats/summary', { preHandler: authenticate(['admin']) as any }, async () => {
    return await equipmentService.getStatistics();
  });

  fastify.post('/api/equipment', { preHandler: authenticate(['admin']) as any }, async (request: any, reply: any) => {
    try {
      const ip = getClientIp(request);
      const equipment = await equipmentService.create(request.user.id, request.body as any, ip);
      return reply.status(201).send(equipment);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/fields', { preHandler: authenticate() as any }, async (request: any) => {
    const query = request.query as any;
    return await fieldService.getAll({
      owner_id: query.owner_id,
      keyword: query.keyword
    });
  });

  fastify.get('/api/fields/:id', { preHandler: authenticate() as any }, async (request: any, reply: any) => {
    const { id } = request.params as any;
    const field = await fieldService.getById(id);
    if (!field) {
      return reply.status(404).send({ error: '地块不存在' });
    }
    return field;
  });

  fastify.get('/api/reservations', { preHandler: authenticate() as any }, async (request: any) => {
    const query = request.query as any;
    const filters: any = {};
    
    if (request.user.role === 'member') {
      filters.member_id = request.user.id;
    }
    if (query.equipment_id) filters.equipment_id = query.equipment_id;
    if (query.status) filters.status = query.status;
    if (query.date) filters.date = query.date;
    if (query.member_id && request.user.role !== 'member') filters.member_id = query.member_id;

    return await reservationService.getAll(filters);
  });

  fastify.get('/api/reservations/:id', { preHandler: authenticate() as any }, async (request: any, reply: any) => {
    const { id } = request.params as any;
    const reservation = await reservationService.getById(id);
    if (!reservation) {
      return reply.status(404).send({ error: '预约不存在' });
    }
    return reservation;
  });

  fastify.post('/api/reservations', { preHandler: authenticate(['member', 'admin']) as any }, async (request: any, reply: any) => {
    try {
      const validation = createReservationSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: validation.error.errors[0].message });
      }
      
      const ip = getClientIp(request);
      const userAgent = request.headers['user-agent'] || '';
      const reservation = await reservationService.create(
        request.user.id, 
        validation.data, 
        ip,
        userAgent
      );
      return reply.status(201).send(reservation);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/api/reservations/check-conflict', { preHandler: authenticate() as any }, async (request: any, reply: any) => {
    try {
      const validation = checkConflictSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: validation.error.errors[0].message });
      }
      
      const hasConflict = await reservationService.checkConflict(
        validation.data.equipment_id,
        validation.data.start_time,
        validation.data.end_time
      );
      
      return { hasConflict };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/api/reservations/:id/cancel', { preHandler: authenticate() as any }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as any;
      const { reason } = request.body as any;
      const ip = getClientIp(request);
      const userAgent = request.headers['user-agent'] || '';
      await reservationService.cancel(
        id, 
        request.user.id, 
        reason || '用户取消', 
        false, 
        ip,
        userAgent
      );
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/api/reservations/:id/resubmit', { preHandler: authenticate(['member', 'admin']) as any }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as any;
      const ip = getClientIp(request);
      const userAgent = request.headers['user-agent'] || '';
      const newReservation = await reservationService.resubmit(
        id,
        request.user.id,
        request.body as any,
        ip,
        userAgent
      );
      return reply.status(201).send(newReservation);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/api/reservations/:id/confirm', { preHandler: authenticate(['operator', 'admin']) as any }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as any;
      const ip = getClientIp(request);
      await reservationService.confirm(id, request.user.id, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/work/tasks', { preHandler: authenticate(['operator', 'admin']) as any }, async (request: any) => {
    return await workService.getMyTasks(request.user.id);
  });

  fastify.get('/api/work/tasks/:id', { preHandler: authenticate(['operator', 'admin']) as any }, async (request: any, reply: any) => {
    const { id } = request.params as any;
    const task = await workService.getTaskById(id, request.user.role === 'admin' ? undefined : request.user.id);
    if (!task) {
      return reply.status(404).send({ error: '任务不存在' });
    }
    return task;
  });

  fastify.post('/api/work/tasks/:id/start', { preHandler: authenticate(['operator', 'admin']) as any }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as any;
      const ip = getClientIp(request);
      await workService.startWork(id, request.user.id, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/api/work/tasks/:id/complete', { preHandler: authenticate(['operator', 'admin']) as any }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as any;
      const { work_hours, fuel_consumption, notes, photos } = request.body as any;
      const ip = getClientIp(request);
      
      const result = await workService.completeWork(
        id,
        request.user.id,
        { work_hours: parseFloat(work_hours), fuel_consumption: parseFloat(fuel_consumption), notes },
        photos || [],
        ip
      );
      
      return { success: true, ...result };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/api/work/tasks/:id/upload-photo', { preHandler: authenticate(['operator', 'admin']) as any }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as any;
      const parts = request.parts();
      const uploadedUrls: string[] = [];

      for await (const part of parts) {
        if (part.type === 'file') {
          const chunks: Buffer[] = [];
          for await (const chunk of part.file) {
            chunks.push(chunk);
          }
          const fileData = Buffer.concat(chunks);
          
          const url = await workService.uploadPhoto(
            id,
            request.user.id,
            fileData,
            part.filename,
            part.mimetype
          );
          uploadedUrls.push(url);
        }
      }

      return { success: true, photos: uploadedUrls };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/maintenance', { preHandler: authenticate() as any }, async (request: any) => {
    const query = request.query as any;
    return await maintenanceService.getAll({
      equipment_id: query.equipment_id,
      status: query.status,
      priority: query.priority,
      reported_by: query.reported_by
    });
  });

  fastify.get('/api/maintenance/:id', { preHandler: authenticate() as any }, async (request: any, reply: any) => {
    const { id } = request.params as any;
    const ticket = await maintenanceService.getById(id);
    if (!ticket) {
      return reply.status(404).send({ error: '工单不存在' });
    }
    return ticket;
  });

  fastify.post('/api/maintenance', { preHandler: authenticate(['operator', 'admin']) as any }, async (request: any, reply: any) => {
    try {
      const validation = createTicketSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: validation.error.errors[0].message });
      }
      
      const ip = getClientIp(request);
      const ticket = await maintenanceService.create(request.user.id, validation.data, ip);
      return reply.status(201).send(ticket);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch('/api/maintenance/:id', { preHandler: authenticate(['admin']) as any }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as any;
      const validation = updateTicketSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.status(400).send({ error: validation.error.errors[0].message });
      }
      
      const ip = getClientIp(request);
      await maintenanceService.update(id, request.user.id, validation.data, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/settlements', { preHandler: authenticate() as any }, async (request: any) => {
    const query = request.query as any;
    const filters: any = {};
    
    if (request.user.role === 'member') {
      filters.member_id = request.user.id;
    }
    if (query.member_id && request.user.role !== 'member') filters.member_id = query.member_id;
    if (query.status) filters.status = query.status;
    if (query.price_type) filters.price_type = query.price_type;
    if (query.month) filters.month = query.month;

    return await settlementService.getAll(filters);
  });

  fastify.get('/api/settlements/:id', { preHandler: authenticate() as any }, async (request: any, reply: any) => {
    const { id } = request.params as any;
    const settlement = await settlementService.getById(id);
    if (!settlement) {
      return reply.status(404).send({ error: '结算单不存在' });
    }
    return settlement;
  });

  fastify.post('/api/settlements/:id/confirm', { preHandler: authenticate(['admin']) as any }, async (request: any, reply: any) => {
    try {
      const { id } = request.params as any;
      const ip = getClientIp(request);
      await settlementService.confirm(id, request.user.id, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/settlements/stats/summary', { preHandler: authenticate() as any }, async (request: any) => {
    const userId = request.user.role === 'member' ? request.user.id : undefined;
    return await settlementService.getStatistics(userId);
  });

  fastify.get('/api/audit-logs', { preHandler: authenticate(['admin']) as any }, async (request: any) => {
    const query = request.query as any;
    return await auditService.getAll({
      user_id: query.user_id,
      action: query.action,
      module: query.module,
      start_date: query.start_date,
      end_date: query.end_date
    });
  });

  fastify.get('/api/dashboard/stats', { preHandler: authenticate() as any }, async (request: any) => {
    const equipmentStats = await equipmentService.getStatistics();
    const settlementStats = await settlementService.getStatistics(
      request.user.role === 'member' ? request.user.id : undefined
    );

    const reservationFilters: any = {};
    if (request.user.role === 'member') {
      reservationFilters.member_id = request.user.id;
    }
    const allReservations = await reservationService.getAll(reservationFilters);
    const todayReservations = allReservations.filter((r: any) => {
      const today = new Date().toDateString();
      return new Date(r.start_time).toDateString() === today;
    });

    const maintenanceTickets = await maintenanceService.getAll({ status: 'open' });

    return {
      equipment: equipmentStats,
      settlements: settlementStats,
      today_reservations: todayReservations.length,
      total_reservations: allReservations.length,
      open_maintenance: maintenanceTickets.length,
      waitlisted_reservations: allReservations.filter((r: any) => r.status === 'waitlisted').length
    };
  });
}
