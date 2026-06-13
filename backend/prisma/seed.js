import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据初始化...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      name: '系统管理员',
      role: 'ADMIN',
      phone: '13800000001',
      company: '科技有限公司',
    },
  });
  console.log('管理员账号创建成功: admin / 123456');

  const financeManager = await prisma.user.upsert({
    where: { username: 'finance_manager' },
    update: {},
    create: {
      username: 'finance_manager',
      email: 'finance_manager@example.com',
      password: hashedPassword,
      name: '财务经理',
      role: 'FINANCE_MANAGER',
      phone: '13800000002',
      company: '科技有限公司',
    },
  });
  console.log('财务经理账号创建成功: finance_manager / 123456');

  const financeStaff = await prisma.user.upsert({
    where: { username: 'finance_staff' },
    update: {},
    create: {
      username: 'finance_staff',
      email: 'finance_staff@example.com',
      password: hashedPassword,
      name: '财务专员',
      role: 'FINANCE_STAFF',
      phone: '13800000003',
      company: '科技有限公司',
    },
  });
  console.log('财务专员账号创建成功: finance_staff / 123456');

  const customer1 = await prisma.customer.upsert({
    where: { customerNo: 'C001' },
    update: {},
    create: {
      customerNo: 'C001',
      name: '北京科技创新有限公司',
      contactName: '张伟',
      phone: '13900000001',
      email: 'zhangwei@tech.com',
      address: '北京市海淀区中关村大街1号',
      creditLimit: 100000,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { customerNo: 'C002' },
    update: {},
    create: {
      customerNo: 'C002',
      name: '上海数字科技股份有限公司',
      contactName: '李娜',
      phone: '13900000002',
      email: 'lina@digital.com',
      address: '上海市浦东新区陆家嘴金融中心',
      creditLimit: 200000,
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { username: 'customer1' },
    update: {},
    create: {
      username: 'customer1',
      email: 'zhangwei@tech.com',
      password: hashedPassword,
      name: '张伟',
      role: 'CUSTOMER',
      phone: '13900000001',
      company: '北京科技创新有限公司',
    },
  });
  console.log('客户账号创建成功: customer1 / 123456');

  const bill1 = await prisma.bill.create({
    data: {
      billNo: 'BIL20250101ABC001',
      customerId: customer1.id,
      billPeriod: '2025-01',
      billDate: new Date('2025-01-01'),
      dueDate: new Date('2025-01-31'),
      totalAmount: 15800,
      paidAmount: 0,
      balanceAmount: 15800,
      status: 'OVERDUE',
      remark: '1月份订阅服务费',
      createdById: financeStaff.id,
      lastHandler: '财务专员',
      lastHandleTime: new Date(),
      billItems: {
        create: [
          {
            productName: '企业版订阅-月度',
            quantity: 1,
            unitPrice: 9800,
            amount: 9800,
            remark: '标准版月费',
          },
          {
            productName: '增值服务包',
            quantity: 2,
            unitPrice: 3000,
            amount: 6000,
            remark: '数据分析增值包',
          },
        ],
      },
    },
  });

  const bill2 = await prisma.bill.create({
    data: {
      billNo: 'BIL20250201ABC002',
      customerId: customer1.id,
      billPeriod: '2025-02',
      billDate: new Date('2025-02-01'),
      dueDate: new Date('2025-02-28'),
      totalAmount: 12800,
      paidAmount: 5000,
      balanceAmount: 7800,
      status: 'PARTIAL_PAID',
      remark: '2月份订阅服务费',
      createdById: financeStaff.id,
      lastHandler: '财务专员',
      lastHandleTime: new Date(),
      billItems: {
        create: [
          {
            productName: '企业版订阅-月度',
            quantity: 1,
            unitPrice: 9800,
            amount: 9800,
          },
          {
            productName: '技术支持服务',
            quantity: 1,
            unitPrice: 3000,
            amount: 3000,
          },
        ],
      },
    },
  });

  const bill3 = await prisma.bill.create({
    data: {
      billNo: 'BIL20250501ABC003',
      customerId: customer2.id,
      billPeriod: '2025-05',
      billDate: new Date('2025-05-01'),
      dueDate: new Date('2025-06-30'),
      totalAmount: 28600,
      paidAmount: 0,
      balanceAmount: 28600,
      status: 'UNPAID',
      remark: '5月份企业服务费用',
      createdById: financeStaff.id,
      lastHandler: '财务专员',
      lastHandleTime: new Date(),
      billItems: {
        create: [
          {
            productName: '旗舰版订阅-季度',
            quantity: 1,
            unitPrice: 25000,
            amount: 25000,
          },
          {
            productName: '定制开发服务',
            quantity: 12,
            unitPrice: 300,
            amount: 3600,
          },
        ],
      },
    },
  });

  const bill4 = await prisma.bill.create({
    data: {
      billNo: 'BIL20250401ABC004',
      customerId: customer2.id,
      billPeriod: '2025-04',
      billDate: new Date('2025-04-01'),
      dueDate: new Date('2025-04-30'),
      totalAmount: 18000,
      paidAmount: 18000,
      balanceAmount: 0,
      status: 'PAID',
      remark: '4月份服务费用',
      createdById: financeStaff.id,
      lastHandler: '财务专员',
      lastHandleTime: new Date(),
      billItems: {
        create: [
          {
            productName: '旗舰版订阅-月度',
            quantity: 1,
            unitPrice: 9800,
            amount: 9800,
          },
          {
            productName: '数据分析服务',
            quantity: 1,
            unitPrice: 8200,
            amount: 8200,
          },
        ],
      },
    },
  });

  console.log('账单数据创建成功，共4条');

  await prisma.payment.create({
    data: {
      paymentNo: 'PAY20250215PAY001',
      billId: bill2.id,
      customerId: customer1.id,
      amount: 5000,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date('2025-02-15'),
      status: 'SUCCESS',
      remark: '部分付款',
      createdById: financeStaff.id,
    },
  });

  await prisma.payment.create({
    data: {
      paymentNo: 'PAY20250420PAY002',
      billId: bill4.id,
      customerId: customer2.id,
      amount: 18000,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date('2025-04-20'),
      status: 'SUCCESS',
      remark: '全额付款',
      createdById: financeStaff.id,
    },
  });

  console.log('付款数据创建成功');

  await prisma.invoice.createMany({
    data: [
      {
        invoiceNo: 'INV20250105INV001',
        billId: bill1.id,
        customerId: customer1.id,
        invoiceType: 'SPECIAL_VAT',
        invoiceAmount: 15800,
        taxAmount: 1565.04,
        status: 'ISSUED',
        issueDate: new Date('2025-01-05'),
        createdById: financeStaff.id,
      },
      {
        invoiceNo: 'INV20250405INV002',
        billId: bill4.id,
        customerId: customer2.id,
        invoiceType: 'SPECIAL_VAT',
        invoiceAmount: 18000,
        taxAmount: 1782.05,
        status: 'ISSUED',
        issueDate: new Date('2025-04-05'),
        createdById: financeStaff.id,
      },
    ],
  });
  console.log('发票数据创建成功');

  await prisma.bankTransaction.createMany({
    data: [
      {
        transNo: 'TRX20250215001',
        customerId: customer1.id,
        amount: 5000,
        transDate: new Date('2025-02-15'),
        transType: 'INCOME',
        counterparty: '北京科技创新有限公司',
        bankAccount: '622202****1234',
        summary: '货款',
        status: 'MATCHED',
        matchedAmount: 5000,
      },
      {
        transNo: 'TRX20250420002',
        customerId: customer2.id,
        amount: 18000,
        transDate: new Date('2025-04-20'),
        transType: 'INCOME',
        counterparty: '上海数字科技股份有限公司',
        bankAccount: '622202****5678',
        summary: '服务费',
        status: 'MATCHED',
        matchedAmount: 18000,
      },
      {
        transNo: 'TRX20250510003',
        customerId: null,
        amount: 8500,
        transDate: new Date('2025-05-10'),
        transType: 'INCOME',
        counterparty: '广州贸易公司',
        bankAccount: '622202****9012',
        summary: '货款',
        status: 'UNMATCHED',
        matchedAmount: 0,
      },
      {
        transNo: 'TRX20250515004',
        customerId: customer1.id,
        amount: 3000,
        transDate: new Date('2025-05-15'),
        transType: 'INCOME',
        counterparty: '北京科技创新有限公司',
        bankAccount: '622202****1234',
        summary: '尾款',
        status: 'UNMATCHED',
        matchedAmount: 0,
      },
    ],
  });
  console.log('银行流水数据创建成功');

  const collection1 = await prisma.collection.create({
    data: {
      collectionNo: 'COL20250201COL001',
      billId: bill1.id,
      customerId: customer1.id,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2025-02-15'),
      amount: 15800,
      currentStage: 2,
      totalStages: 3,
      assignedToId: financeStaff.id,
      remark: '逾期催款中',
    },
  });

  await prisma.collectionRecord.createMany({
    data: [
      {
        collectionId: collection1.id,
        stage: 1,
        action: '电话催收',
        result: '客户承诺10日内付款',
        contactTime: new Date('2025-02-05'),
        operatorId: financeStaff.id,
        remark: '首次联系',
      },
      {
        collectionId: collection1.id,
        stage: 2,
        action: '邮件催款函',
        result: '客户回复资金紧张，延期支付',
        contactTime: new Date('2025-02-15'),
        operatorId: financeStaff.id,
        remark: '发送正式催款函',
      },
    ],
  });
  console.log('催收数据创建成功');

  const refund1 = await prisma.refund.create({
    data: {
      refundNo: 'REF20250520REF001',
      billId: bill3.id,
      customerId: customer2.id,
      refundAmount: 2000,
      refundReason: '服务未按约定交付，申请部分退款',
      refundType: 'PARTIAL',
      status: 'PENDING',
      applyById: financeStaff.id,
      remark: '客户投诉服务延迟',
    },
  });
  console.log('退款数据创建成功');

  await prisma.timeline.createMany({
    data: [
      {
        billId: bill1.id,
        eventType: 'BILL_CREATED',
        eventName: '账单创建',
        description: '创建1月份订阅服务费账单，金额15,800元',
        operatorId: financeStaff.id,
        operatorName: '财务专员',
        eventTime: new Date('2025-01-01'),
      },
      {
        billId: bill1.id,
        eventType: 'INVOICE_ISSUED',
        eventName: '发票开具',
        description: '已开具增值税专用发票',
        operatorId: financeStaff.id,
        operatorName: '财务专员',
        eventTime: new Date('2025-01-05'),
      },
      {
        billId: bill1.id,
        eventType: 'BILL_OVERDUE',
        eventName: '账单逾期',
        description: '账单已逾期，请及时付款',
        operatorId: null,
        operatorName: '系统',
        eventTime: new Date('2025-02-01'),
      },
      {
        billId: bill1.id,
        collectionId: collection1.id,
        eventType: 'COLLECTION_CREATED',
        eventName: '开始催收',
        description: '创建催收单，进入第一阶段催收',
        operatorId: financeStaff.id,
        operatorName: '财务专员',
        eventTime: new Date('2025-02-03'),
      },
      {
        billId: bill2.id,
        paymentId: 1,
        eventType: 'PAYMENT_RECEIVED',
        eventName: '收到付款',
        description: '收到部分付款5,000元',
        operatorId: financeStaff.id,
        operatorName: '财务专员',
        eventTime: new Date('2025-02-15'),
      },
      {
        billId: bill3.id,
        refundId: refund1.id,
        eventType: 'REFUND_APPLIED',
        eventName: '退款申请',
        description: '申请退款2,000元，等待审批',
        operatorId: financeStaff.id,
        operatorName: '财务专员',
        eventTime: new Date('2025-05-20'),
      },
    ],
  });
  console.log('时间轴数据创建成功');

  console.log('种子数据初始化完成！');
  console.log('');
  console.log('测试账号：');
  console.log('  管理员: admin / 123456');
  console.log('  财务经理: finance_manager / 123456');
  console.log('  财务专员: finance_staff / 123456');
  console.log('  客户: customer1 / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
