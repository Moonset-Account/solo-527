import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { customers, appointments } from '$lib/db/schema';
import { and, gte, lte, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const months: string[] = [];
  const rates: number[] = [];
  const newCustomers: number[] = [];
  const returningCustomers: number[] = [];

  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date(currentYear, now.getMonth() - i, 1);
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    months.push(monthStr);

    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

    const totalCustomersResult = await db
      .select({ count: sql<number>`count(distinct ${appointments.customerId})` })
      .from(appointments)
      .where(
        and(
          gte(appointments.appointmentDate, monthStart.toISOString().split('T')[0]),
          lte(appointments.appointmentDate, monthEnd.toISOString().split('T')[0])
        )
      );

    const newCustomersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(
        and(
          gte(customers.createdAt, monthStart),
          lte(customers.createdAt, monthEnd)
        )
      );

    const returningResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(
        sql`(SELECT customer_id, COUNT(*) as visit_count FROM appointments WHERE appointment_date >= ${monthStart.toISOString().split('T')[0]} AND appointment_date <= ${monthEnd.toISOString().split('T')[0]} GROUP BY customer_id HAVING COUNT(*) > 1) AS repeat_customers`
      );

    const total = Number(totalCustomersResult[0]?.count ?? 0);
    const newCount = Number(newCustomersResult[0]?.count ?? 0);
    const returningCount = Number(returningResult[0]?.count ?? 0);
    const rate = total > 0 ? Math.round((returningCount / total) * 100) : 0;

    rates.push(rate);
    newCustomers.push(newCount);
    returningCustomers.push(returningCount);
  }

  return json({ months, rates, newCustomers, returningCustomers });
};
