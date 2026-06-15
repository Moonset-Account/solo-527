import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { appointments, customers, technicians, services } from '$lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

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
  return json(result, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const { id, status, remark } = body;

  const [result] = await db
    .update(appointments)
    .set({
      ...(status !== undefined && { status }),
      ...(remark !== undefined && { remark }),
      updatedAt: new Date()
    })
    .where(eq(appointments.id, id))
    .returning();

  return json(result);
};
