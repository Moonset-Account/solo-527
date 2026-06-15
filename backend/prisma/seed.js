import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || 'mysql://root@localhost:3306/rental_apartment';
const url = new URL(databaseUrl);

const adapter = new PrismaMariaDb({
  host: url.hostname || 'localhost',
  port: Number(url.port) || 3306,
  user: url.username || 'root',
  password: decodeURIComponent(url.password) || undefined,
  database: url.pathname.replace(/^\//, '') || 'rental_apartment',
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.consultant.createMany({
    data: [
      { id: 'c1', name: '张顾问', phone: '13800001111', role: 'senior' },
      { id: 'c2', name: '李顾问', phone: '13800002222', role: 'consultant' },
      { id: 'c3', name: '王顾问', phone: '13800003333', role: 'consultant' },
    ],
  });

  await prisma.property.createMany({
    data: [
      { id: 'p1', title: '阳光花园A栋301', address: '朝阳区阳光花园A栋3层301', area: 85.5, monthlyRent: 5500, layout: '两室一厅', floor: '3/18', orientation: '南', status: 'OCCUPIED', vacancyDays: 0, landlordId: 'l1', landlordName: '赵房东', escrowManagerId: 'em1', escrowManagerName: '刘经理' },
      { id: 'p2', title: '翠湖名苑B栋502', address: '海淀区翠湖名苑B栋5层502', area: 72, monthlyRent: 4800, layout: '一室一厅', floor: '5/22', orientation: '东南', status: 'VACANT', vacancyDays: 35, landlordId: 'l2', landlordName: '钱房东' },
      { id: 'p3', title: '星河湾C栋1201', address: '丰台区星河湾C栋12层1201', area: 120, monthlyRent: 8900, layout: '三室两厅', floor: '12/25', orientation: '南北', status: 'PROCESSING', vacancyDays: 5, landlordId: 'l3', landlordName: '孙房东' },
      { id: 'p4', title: '望京新城D栋803', address: '朝阳区望京新城D栋8层803', area: 55, monthlyRent: 3500, layout: '开间', floor: '8/15', orientation: '西', status: 'ANOMALOUS', vacancyDays: 12, landlordId: 'l4', landlordName: '李房东', escrowManagerId: 'em2', escrowManagerName: '张经理' },
      { id: 'p5', title: '回龙观E栋1602', address: '昌平区回龙观E栋16层1602', area: 90, monthlyRent: 4200, layout: '两室一厅', floor: '16/20', orientation: '南', status: 'VACANT', vacancyDays: 60, landlordId: 'l5', landlordName: '周房东' },
    ],
  });

  await prisma.tenant.createMany({
    data: [
      { id: 't1', name: '陈小明', phone: '13900001111', idCard: '110101199001011234', email: 'chen@example.com' },
      { id: 't2', name: '林小红', phone: '13900002222', idCard: '310101199205052345', email: 'lin@example.com' },
      { id: 't3', name: '吴大伟', phone: '13900003333', idCard: '440101198803033456' },
      { id: 't4', name: '郑丽华', phone: '13900004444', email: 'zheng@example.com' },
    ],
  });

  await prisma.viewing.createMany({
    data: [
      { id: 'v1', tenantId: 't1', propertyId: 'p1', consultantId: 'c1', scheduledAt: new Date('2026-06-10'), status: 'COMPLETED', notes: '租客满意，准备签约' },
      { id: 'v2', tenantId: 't2', propertyId: 'p2', consultantId: 'c2', scheduledAt: new Date('2026-06-15'), status: 'PENDING' },
      { id: 'v3', tenantId: 't3', propertyId: 'p3', consultantId: 'c1', scheduledAt: new Date('2026-06-18'), status: 'CONFIRMED' },
      { id: 'v4', tenantId: 't4', propertyId: 'p5', consultantId: 'c3', scheduledAt: new Date('2026-06-12'), status: 'NO_SHOW' },
    ],
  });

  await prisma.contract.createMany({
    data: [
      { id: 'ct1', tenantId: 't1', propertyId: 'p1', consultantId: 'c1', startDate: new Date('2026-03-01'), endDate: new Date('2027-02-28'), monthlyRent: 5500, depositAmount: 11000, paymentDay: 1, attachmentUrl: '/contracts/ct1.pdf', reviewStatus: 'APPROVED', signStatus: 'SIGNED' },
      { id: 'ct2', tenantId: 't3', propertyId: 'p3', consultantId: 'c1', startDate: new Date('2026-07-01'), endDate: new Date('2027-06-30'), monthlyRent: 8900, depositAmount: 17800, paymentDay: 5, attachmentUrl: '/contracts/ct2.pdf', reviewStatus: 'REVIEWING', signStatus: 'PENDING_SIGN' },
      { id: 'ct3', tenantId: 't2', propertyId: 'p2', consultantId: 'c2', startDate: new Date('2026-07-01'), endDate: new Date('2027-06-30'), monthlyRent: 4800, depositAmount: 9600, paymentDay: 1, reviewStatus: 'DRAFT', signStatus: 'PENDING_SIGN' },
    ],
  });

  await prisma.bill.createMany({
    data: [
      { id: 'b1', contractId: 'ct1', billType: 'DEPOSIT', amount: 11000, dueDate: new Date('2026-03-01'), paidDate: new Date('2026-03-01'), status: 'PAID' },
      { id: 'b2', contractId: 'ct1', billType: 'RENT', amount: 5500, dueDate: new Date('2026-03-01'), paidDate: new Date('2026-03-01'), status: 'PAID' },
      { id: 'b3', contractId: 'ct1', billType: 'RENT', amount: 5500, dueDate: new Date('2026-04-01'), paidDate: new Date('2026-04-02'), status: 'PAID' },
      { id: 'b4', contractId: 'ct1', billType: 'RENT', amount: 5500, dueDate: new Date('2026-05-01'), paidDate: new Date('2026-05-01'), status: 'PAID' },
      { id: 'b5', contractId: 'ct1', billType: 'RENT', amount: 5500, dueDate: new Date('2026-06-01'), status: 'OVERDUE', overdueDays: 15 },
      { id: 'b6', contractId: 'ct2', billType: 'DEPOSIT', amount: 17800, dueDate: new Date('2026-06-20'), status: 'PENDING' },
    ],
  });

  await prisma.todo.createMany({
    data: [
      { id: 'td1', sourceType: 'OVERDUE_RENT', sourceId: 'b5', title: '租金逾期 - 陈小明 - 阳光花园A栋301', description: '租金账单已逾期15天，金额: 5500', priority: 'HIGH', status: 'IN_PROGRESS', assignedTo: 'c1', dueDate: new Date('2026-06-19') },
      { id: 'td2', sourceType: 'VACANCY_ALERT', sourceId: 'p5', title: '房源长期空置 - 回龙观E栋1602', description: '房源已空置60天，需要跟进', priority: 'HIGH', status: 'OPEN', assignedTo: 'c3', dueDate: new Date('2026-06-20') },
      { id: 'td3', sourceType: 'REVIEW_REQUIRED', sourceId: 'ct2', title: '合同待审核 - 吴大伟 - 星河湾C栋1201', description: '合同附件已上传，等待审核', priority: 'MEDIUM', status: 'OPEN', assignedTo: 'c1' },
      { id: 'td4', sourceType: 'CONTRACT_ANOMALY', sourceId: 'p4', title: '房源状态异常 - 望京新城D栋803', description: '房源状态标记为异常，需排查原因', priority: 'URGENT', status: 'OPEN', assignedTo: 'c2', dueDate: new Date('2026-06-17') },
    ],
  });

  await prisma.consultantFollowUp.createMany({
    data: [
      { id: 'fu1', consultantId: 'c1', tenantId: 't1', propertyId: 'p1', content: '租客已入住，反馈良好', followUpType: 'PHONE_CALL', nextFollowUpAt: new Date('2026-07-01') },
      { id: 'fu2', consultantId: 'c1', tenantId: 't3', propertyId: 'p3', content: '租客确认看房时间，准备签约流程', followUpType: 'CONTRACT_DISCUSSION' },
      { id: 'fu3', consultantId: 'c2', tenantId: 't2', propertyId: 'p2', content: '跟进预约看房事宜', followUpType: 'SITE_VISIT', nextFollowUpAt: new Date('2026-06-15') },
    ],
  });

  console.log('Seed data inserted successfully');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
