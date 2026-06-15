import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { cashierRecords, customers, technicians, services, treatmentCards } from '$lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  const conditions = [];
  if (startDate) conditions.push(gte(cashierRecords.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(cashierRecords.createdAt, new Date(endDate)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = await db
    .select({
      record: cashierRecords,
      customer: { id: customers.id, name: customers.name, phone: customers.phone },
      technician: { id: technicians.id, name: technicians.name },
      service: { id: services.id, name: services.name }
    })
    .from(cashierRecords)
    .leftJoin(customers, eq(cashierRecords.customerId, customers.id))
    .leftJoin(technicians, eq(cashierRecords.technicianId, technicians.id))
    .leftJoin(services, eq(cashierRecords.serviceId, services.id))
    .where(whereClause)
    .orderBy(desc(cashierRecords.createdAt));

  return json(data);
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const [result] = await db
    .insert(cashierRecords)
    .values({
      customerId: body.customerId,
      technicianId: body.technicianId,
      serviceId: body.serviceId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      type: body.type,
      treatmentCardId: body.treatmentCardId,
      remark: body.remark
    })
    .returning();
  return json(result, { status: 201 });
};
