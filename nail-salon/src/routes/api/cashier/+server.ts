import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/index';
import { cashierRecords, customers, technicians, services, treatmentCards } from '$lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { addHistory } from '$lib/db/history';

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

  const customer = await db.select().from(customers).where(eq(customers.id, body.customerId));
  const operatorName = body.operatorName ?? '前台';

  const methodText: Record<string, string> = {
    wechat: '微信',
    alipay: '支付宝',
    cash: '现金',
    bank: '银行卡',
    treatment_card: '疗程卡'
  };

  const typeText: Record<string, string> = {
    service: '服务消费',
    treatment: '疗程购买',
    product: '产品销售'
  };

  let detail = `收银：${customer[0]?.name ?? '客户'} ¥${body.amount} ${methodText[body.paymentMethod] ?? body.paymentMethod} ${typeText[body.type] ?? body.type}`;
  if (body.remark) detail += ` - ${body.remark}`;

  await addHistory({
    operatorName,
    action: '创建',
    targetType: 'cashier',
    targetId: result.id,
    detail,
    metadata: {
      amount: String(body.amount),
      paymentMethod: body.paymentMethod,
      type: body.type,
      customer: customer[0]?.name,
      remark: body.remark
    }
  });

  return json(result, { status: 201 });
};
