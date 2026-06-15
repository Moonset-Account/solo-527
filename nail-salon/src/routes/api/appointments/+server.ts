import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { appointments, customers, technicians, services } from '$lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { addHistory } from '$lib/db/history';

export const GET: RequestHandler = async ({ url }) => {
  const status = url.searchParams.get('status');
  const date = url.searchParams.get('date');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  const conditions = [];
  if (status) conditions.push(eq(appointments.status, status));
  if (date) conditions.push(eq(appointments.appointmentDate, date));
  if (startDate) conditions.push(gte(appointments.appointmentDate, startDate));
  if (endDate) conditions.push(lte(appointments.appointmentDate, endDate));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      appointment: appointments,
      customer: { id: customers.id, name: customers.name, phone: customers.phone },
      technician: { id: technicians.id, name: technicians.name },
      service: { id: services.id, name: services.name, price: services.price }
    })
    .from(appointments)
    .leftJoin(customers, eq(appointments.customerId, customers.id))
    .leftJoin(technicians, eq(appointments.technicianId, technicians.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(whereClause)
    .orderBy(desc(appointments.appointmentDate), desc(appointments.appointmentTime));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const [result] = await db
    .insert(appointments)
    .values({
      customerId: body.customerId,
      technicianId: body.technicianId,
      serviceId: body.serviceId,
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      status: body.status ?? 'pending',
      remark: body.remark
    })
    .returning();

  const customer = await db.select().from(customers).where(eq(customers.id, body.customerId));
  const tech = await db.select().from(technicians).where(eq(technicians.id, body.technicianId));
  const svc = await db.select().from(services).where(eq(services.id, body.serviceId));
  const operatorName = body.operatorName ?? '客户';

  await addHistory({
    operatorName,
    action: '创建',
    targetType: 'appointment',
    targetId: result.id,
    detail: `预约：${customer[0]?.name ?? '客户'} ${body.appointmentDate} ${body.appointmentTime} ${tech[0]?.name ?? ''}技师`,
    metadata: {
      customer: customer[0]?.name,
      technician: tech[0]?.name,
      service: svc[0]?.name,
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime
    }
  });

  return json(result, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, status, remark, operatorName = '店长' } = body;

  const [result] = await db
    .update(appointments)
    .set({
      ...(status !== undefined && { status }),
      ...(remark !== undefined && { remark }),
      updatedAt: new Date()
    })
    .where(eq(appointments.id, id))
    .returning();

  const statusText: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消'
  };

  if (status !== undefined) {
    const [fullAppt] = await db
      .select({
        appointment: appointments,
        customer: { name: customers.name },
        technician: { name: technicians.name }
      })
      .from(appointments)
      .leftJoin(customers, eq(appointments.customerId, customers.id))
      .leftJoin(technicians, eq(appointments.technicianId, technicians.id))
      .where(eq(appointments.id, id));

    await addHistory({
      operatorName,
      action: '更新',
      targetType: 'appointment',
      targetId: id,
      detail: `预约${statusText[status] ?? status}：${fullAppt?.customer?.name ?? ''} ${fullAppt?.appointment.appointmentDate} ${fullAppt?.technician?.name ?? ''}技师`,
      metadata: {
        status,
        customer: fullAppt?.customer?.name,
        technician: fullAppt?.technician?.name
      }
    });
  }

  return json(result);
};
