import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/auth.service';
import { EquipmentService } from '../services/equipment.service';
import { ReservationService } from '../services/reservation.service';
import { WorkService } from '../services/work.service';
import { MaintenanceService } from '../services/maintenance.service';
import { SettlementService } from '../services/settlement.service';
import { AuditService } from '../services/audit.service';
import { FieldService } from '../services/field.service';
import { authenticate, AuthRequest, getClientIp } from '../middleware/auth';

const authService = new AuthService();
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
      const { username, password } = request.body as any;
      const ip = getClientIp(request);
      const result = await authService.login(username, password, ip);
      
      if (!result) {
        return reply.status(401).send({ error: '用户名或密码错误' });
      }
      
      return result;
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/auth/me', { preHandler: authenticate() }, async (request: AuthRequest, reply) => {
    const user = await authService.getCurrentUser(request.user!.id);
    if (!user) {
      return reply.status(404).send({ error: '用户不存在' });
    }
    return user;
  });

  fastify.get('/api/equipment', { preHandler: authenticate() }, async (request: AuthRequest) => {
    const query = request.query as any;
    return await equipmentService.getAll({
      type: query.type,
      status: query.status,
      keyword: query.keyword
    });
  });

  fastify.get('/api/equipment/:id', { preHandler: authenticate() }, async (request: AuthRequest, reply) => {
    const { id } = request.params as any;
    const equipment = await equipmentService.getById(id);
    if (!equipment) {
      return reply.status(404).send({ error: '设备不存在' });
    }
    return equipment;
  });

  fastify.get('/api/equipment/stats/summary', { preHandler: authenticate(['admin']) }, async () => {
    return await equipmentService.getStatistics();
  });

  fastify.post('/api/equipment', { preHandler: authenticate(['admin']) }, async (request: AuthRequest, reply) => {
    try {
      const ip = getClientIp(request);
      const equipment = await equipmentService.create(request.user!.id, request.body as any, ip);
      return reply.status(201).send(equipment);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/fields', { preHandler: authenticate() }, async (request: AuthRequest) => {
    const query = request.query as any;
    return await fieldService.getAll({
      owner_id: query.owner_id,
      keyword: query.keyword
    });
  });

  fastify.get('/api/fields/:id', { preHandler: authenticate() }, async (request: AuthRequest, reply) => {
    const { id } = request.params as any;
    const field = await fieldService.getById(id);
    if (!field) {
      return reply.status(404).send({ error: '地块不存在' });
    }
    return field;
  });

  fastify.get('/api/reservations', { preHandler: authenticate() }, async (request: AuthRequest) => {
    const query = request.query as any;
    const filters: any = {};
    
    if (request.user!.role === 'member') {
      filters.user_id = request.user!.id;
    }
    if (query.equipment_id) filters.equipment_id = query.equipment_id;
    if (query.status) filters.status = query.status;
    if (query.start_date) filters.start_date = query.start_date;
    if (query.end_date) filters.end_date = query.end_date;
    if (query.user_id && request.user!.role !== 'member') filters.user_id = query.user_id;

    return await reservationService.getAll(filters);
  });

  fastify.get('/api/reservations/:id', { preHandler: authenticate() }, async (request: AuthRequest, reply) => {
    const { id } = request.params as any;
    const reservation = await reservationService.getById(id);
    if (!reservation) {
      return reply.status(404).send({ error: '预约不存在' });
    }
    return reservation;
  });

  fastify.post('/api/reservations', { preHandler: authenticate(['member', 'admin']) }, async (request: AuthRequest, reply) => {
    try {
      const ip = getClientIp(request);
      const reservation = await reservationService.create(request.user!.id, request.body as any, ip);
      return reply.status(201).send(reservation);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/reservations/:id/cancel', { preHandler: authenticate() }, async (request: AuthRequest, reply) => {
    try {
      const { id } = request.params as any;
      const { reason } = request.body as any;
      const ip = getClientIp(request);
      await reservationService.cancel(id, request.user!.id, reason || '用户取消', false, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/api/reservations/:id/confirm', { preHandler: authenticate(['operator', 'admin']) }, async (request: AuthRequest, reply) => {
    try {
      const { id } = request.params as any;
      const ip = getClientIp(request);
      await reservationService.confirm(id, request.user!.id, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/work/orders', { preHandler: authenticate(['operator', 'admin']) }, async (request: AuthRequest) => {
    return await workService.getMyOrders(request.user!.id);
  });

  fastify.post('/api/work/orders/:id/accept', { preHandler: authenticate(['operator', 'admin']) }, async (request: AuthRequest, reply) => {
    try {
      const { id } = request.params as any;
      const ip = getClientIp(request);
      await workService.acceptOrder(id, request.user!.id, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/work/orders/:id/complete', { preHandler: authenticate(['operator', 'admin']) }, async (request: AuthRequest, reply) => {
    try {
      const { id } = request.params as any;
      const ip = getClientIp(request);
      await workService.completeWork(id, request.user!.id, request.body as any, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/maintenance', { preHandler: authenticate() }, async (request: AuthRequest) => {
    const query = request.query as any;
    return await maintenanceService.getAll({
      equipment_id: query.equipment_id,
      status: query.status
    });
  });

  fastify.post('/api/maintenance', { preHandler: authenticate(['operator', 'admin']) }, async (request: AuthRequest, reply) => {
    try {
      const ip = getClientIp(request);
      const ticket = await maintenanceService.create(request.user!.id, request.body as any, ip);
      return reply.status(201).send(ticket);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/maintenance/:id/status', { preHandler: authenticate(['admin']) }, async (request: AuthRequest, reply) => {
    try {
      const { id } = request.params as any;
      const { status, cost } = request.body as any;
      const ip = getClientIp(request);
      await maintenanceService.updateStatus(id, request.user!.id, status, cost, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/settlements', { preHandler: authenticate() }, async (request: AuthRequest) => {
    const query = request.query as any;
    const filters: any = {};
    
    if (request.user!.role === 'member') {
      filters.user_id = request.user!.id;
    }
    if (query.user_id && request.user!.role !== 'member') filters.user_id = query.user_id;
    if (query.status) filters.status = query.status;
    if (query.start_date) filters.start_date = query.start_date;
    if (query.end_date) filters.end_date = query.end_date;

    return await settlementService.getAll(filters);
  });

  fastify.get('/api/settlements/:id', { preHandler: authenticate() }, async (request: AuthRequest, reply) => {
    const { id } = request.params as any;
    const settlement = await settlementService.getById(id);
    if (!settlement) {
      return reply.status(404).send({ error: '结算单不存在' });
    }
    return settlement;
  });

  fastify.post('/api/settlements/:id/confirm', { preHandler: authenticate(['admin']) }, async (request: AuthRequest, reply) => {
    try {
      const { id } = request.params as any;
      const ip = getClientIp(request);
      await settlementService.confirm(id, request.user!.id, ip);
      return { success: true };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.get('/api/settlements/stats/summary', { preHandler: authenticate() }, async (request: AuthRequest) => {
    const userId = request.user!.role === 'member' ? request.user!.id : undefined;
    return await settlementService.getStatistics(userId);
  });

  fastify.get('/api/audit-logs', { preHandler: authenticate(['admin']) }, async (request: AuthRequest) => {
    const query = request.query as any;
    return await auditService.getAll({
      user_id: query.user_id,
      action: query.action,
      resource_type: query.resource_type,
      start_date: query.start_date,
      end_date: query.end_date,
      page: parseInt(query.page || '1'),
      page_size: parseInt(query.page_size || '20')
    });
  });

  fastify.get('/api/dashboard/stats', { preHandler: authenticate() }, async (request: AuthRequest) => {
    const equipmentStats = await equipmentService.getStatistics();
    const settlementStats = await settlementService.getStatistics(
      request.user!.role === 'member' ? request.user!.id : undefined
    );

    const reservationFilters: any = {};
    if (request.user!.role === 'member') {
      reservationFilters.user_id = request.user!.id;
    }
    const allReservations = await reservationService.getAll(reservationFilters);
    const todayReservations = allReservations.filter(r => {
      const today = new Date().toDateString();
      return new Date(r.start_time).toDateString() === today;
    });

    const maintenanceTickets = await maintenanceService.getAll({ status: 'open' });

    return {
      equipment: equipmentStats,
      settlements: settlementStats,
      today_reservations: todayReservations.length,
      total_reservations: allReservations.length,
      open_maintenance: maintenanceTickets.length
    };
  });
}
