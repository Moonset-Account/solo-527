import { PrismaClient, UserRole, LeaseStatus, BillStatus, AssignmentType, AssignmentStatus, Priority, ExceptionType, ExceptionLevel, ExceptionStatus, SettlementStatus, ContractStatus } from "@prisma/client";
import { addMonths, subDays, addDays, format, startOfMonth, endOfMonth } from "date-fns";
import { zhCN } from "date-fns/locale";

const prisma = new PrismaClient();

async function main() {
  console.log("开始生成 mock 数据...");

  await prisma.changeRecord.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exceptionOrder.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.property.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.user.deleteMany();

  const users = await prisma.user.createManyAndReturn({
    data: [
      { clerkId: "clerk_admin_001", name: "张经理", email: "admin@rental.com", role: UserRole.ADMIN },
      { clerkId: "clerk_finance_001", name: "李财务", email: "finance@rental.com", role: UserRole.FINANCE },
      { clerkId: "clerk_finance_002", name: "王会计", email: "finance2@rental.com", role: UserRole.FINANCE },
      { clerkId: "clerk_front_001", name: "刘一线", email: "front1@rental.com", role: UserRole.FRONTLINE },
      { clerkId: "clerk_front_002", name: "陈运营", email: "front2@rental.com", role: UserRole.FRONTLINE },
    ],
  });

  const adminUser = users.find(u => u.role === UserRole.ADMIN)!;
  const financeUser = users.find(u => u.role === UserRole.FINANCE)!;
  const frontlineUser1 = users.find(u => u.name === "刘一线")!;
  const frontlineUser2 = users.find(u => u.name === "陈运营")!;

  const owners = await prisma.owner.createManyAndReturn({
    data: [
      { name: "王明远", phone: "13800138001", email: "wangmy@email.com" },
      { name: "李建华", phone: "13800138002", email: "lijh@email.com" },
      { name: "张伟强", phone: "13800138003", email: "zhangwq@email.com" },
      { name: "刘芳", phone: "13800138004", email: "liuf@email.com" },
      { name: "陈静", phone: "13800138005", email: "chenj@email.com" },
    ],
  });

  const properties = await prisma.property.createManyAndReturn({
    data: [
      { name: "创智大厦 A座 1201", address: "上海市浦东新区张江高科技园区博云路2号", ownerId: owners[0].id },
      { name: "创智大厦 A座 1202", address: "上海市浦东新区张江高科技园区博云路2号", ownerId: owners[0].id },
      { name: "创智大厦 B座 503", address: "上海市浦东新区张江高科技园区博云路2号", ownerId: owners[1].id },
      { name: "腾讯大厦 808", address: "上海市徐汇区漕河泾开发区古美路1582号", ownerId: owners[2].id },
      { name: "腾讯大厦 1502", address: "上海市徐汇区漕河泾开发区古美路1582号", ownerId: owners[2].id },
      { name: "阿里巴巴中心 1101", address: "上海市浦东新区张江高科技园区晨晖路88号", ownerId: owners[3].id },
      { name: "万达广场 B座 2201", address: "上海市杨浦区邯郸路600号", ownerId: owners[4].id },
      { name: "万达广场 B座 2202", address: "上海市杨浦区邯郸路600号", ownerId: owners[4].id },
    ],
  });

  const tenants = await prisma.tenant.createManyAndReturn({
    data: [
      { name: "上海信息技术有限公司", phone: "021-55556666", email: "contact@shinfo.com", company: "上海信息技术有限公司" },
      { name: "云端网络科技", phone: "021-55556667", email: "contact@cloudtech.com", company: "云端网络科技有限公司" },
      { name: "智慧生活服务", phone: "021-55556668", email: "contact@smartlife.com", company: "智慧生活服务有限公司" },
      { name: "数据洞察咨询", phone: "021-55556669", email: "contact@datainsight.com", company: "数据洞察咨询有限公司" },
      { name: "创新设计工作室", phone: "021-55556670", email: "contact@innovdesign.com", company: "创新设计工作室" },
      { name: "未来教育科技", phone: "021-55556671", email: "contact@futureedu.com", company: "未来教育科技有限公司" },
      { name: "健康医疗科技", phone: "021-55556672", email: "contact@healthtech.com", company: "健康医疗科技有限公司" },
      { name: "绿色能源科技", phone: "021-55556673", email: "contact@greenenergy.com", company: "绿色能源科技有限公司" },
    ],
  });

  const today = new Date();
  
  const leasesData = [
    { propertyId: properties[0].id, tenantId: tenants[0].id, ownerId: owners[0].id, monthlyRent: 28000, deposit: 56000, startDate: addMonths(today, -12), endDate: addMonths(today, 12), status: LeaseStatus.ACTIVE, paymentDay: 5 },
    { propertyId: properties[1].id, tenantId: tenants[1].id, ownerId: owners[0].id, monthlyRent: 32000, deposit: 64000, startDate: addMonths(today, -6), endDate: addMonths(today, 18), status: LeaseStatus.ACTIVE, paymentDay: 10 },
    { propertyId: properties[2].id, tenantId: tenants[2].id, ownerId: owners[1].id, monthlyRent: 18000, deposit: 36000, startDate: addMonths(today, -24), endDate: addMonths(today, 0), status: LeaseStatus.ACTIVE, paymentDay: 15 },
    { propertyId: properties[3].id, tenantId: tenants[3].id, ownerId: owners[2].id, monthlyRent: 45000, deposit: 90000, startDate: addMonths(today, -3), endDate: addMonths(today, 21), status: LeaseStatus.ACTIVE, paymentDay: 1 },
    { propertyId: properties[4].id, tenantId: tenants[4].id, ownerId: owners[2].id, monthlyRent: 38000, deposit: 76000, startDate: addMonths(today, -1), endDate: addMonths(today, 23), status: LeaseStatus.ACTIVE, paymentDay: 8 },
    { propertyId: properties[5].id, tenantId: tenants[5].id, ownerId: owners[3].id, monthlyRent: 52000, deposit: 104000, startDate: addMonths(today, -8), endDate: addMonths(today, 4), status: LeaseStatus.ACTIVE, paymentDay: 20 },
    { propertyId: properties[6].id, tenantId: tenants[6].id, ownerId: owners[4].id, monthlyRent: 25000, deposit: 50000, startDate: addMonths(today, -18), endDate: addMonths(today, 6), status: LeaseStatus.ACTIVE, paymentDay: 25 },
    { propertyId: properties[7].id, tenantId: tenants[7].id, ownerId: owners[4].id, monthlyRent: 22000, deposit: 44000, startDate: addMonths(today, -2), endDate: addMonths(today, 22), status: LeaseStatus.PENDING, paymentDay: 5 },
  ];

  const leases: { id: string }[] = [];
  for (const leaseData of leasesData) {
    const lease = await prisma.lease.create({ data: leaseData });
    leases.push(lease);
    
    for (let i = 0; i < 6; i++) {
      const billMonth = addMonths(today, -5 + i);
      const period = format(billMonth, "yyyy年MM月", { locale: zhCN });
      const dueDate = new Date(billMonth.getFullYear(), billMonth.getMonth(), leaseData.paymentDay);
      
      let status = BillStatus.PAID;
      let paidDate = addDays(dueDate, -1);
      let paidAmount = leaseData.monthlyRent;
      
      if (i === 4) {
        status = BillStatus.UNPAID;
        paidAmount = 0;
        paidDate = null as any;
      }
      if (i === 3) {
        status = BillStatus.OVERDUE;
        paidAmount = 0;
        paidDate = null as any;
      }
      if (i === 2) {
        status = BillStatus.PARTIAL;
        paidAmount = Math.floor(leaseData.monthlyRent * 0.5);
        paidDate = addDays(dueDate, 3);
      }
      
      const bill = await prisma.bill.create({
        data: {
          leaseId: lease.id,
          billNo: `BILL${format(billMonth, "yyyyMM")}${String(leases.indexOf(lease) + 1).padStart(3, "0")}`,
          period,
          amount: leaseData.monthlyRent,
          paidAmount,
          dueDate,
          paidDate,
          status,
          paymentMethod: status === BillStatus.PAID ? "银行转账" : null,
        },
      });

      if (status === BillStatus.OVERDUE) {
        const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const exceptionLevel = overdueDays > 30 ? ExceptionLevel.CRITICAL : overdueDays > 7 ? ExceptionLevel.SERIOUS : ExceptionLevel.NORMAL;
        
        const exception = await prisma.exceptionOrder.create({
          data: {
            billId: bill.id,
            type: ExceptionType.OVERDUE,
            level: exceptionLevel,
            status: ExceptionStatus.HANDLING,
            description: `租金逾期${overdueDays}天，金额：¥${leaseData.monthlyRent.toLocaleString()}`,
          },
        });

        await prisma.bill.update({
          where: { id: bill.id },
          data: { exceptionId: exception.id, status: BillStatus.EXCEPTION },
        });

        await prisma.assignment.create({
          data: {
            leaseId: lease.id,
            billId: bill.id,
            type: AssignmentType.COLLECTION,
            priority: Priority.HIGH,
            assigneeId: frontlineUser1.id,
            title: `租金逾期催收 - ${properties.find(p => p.id === leaseData.propertyId)?.name}`,
            description: `${tenants.find(t => t.id === leaseData.tenantId)?.name} 已逾期${overdueDays}天，需上门催收。`,
            status: AssignmentStatus.IN_PROGRESS,
          },
        });
      }
    }

    if (leaseData.status === LeaseStatus.ACTIVE) {
      await prisma.contract.create({
        data: {
          leaseId: lease.id,
          contractNo: `CONT${format(today, "yyyy")}${String(leases.indexOf(lease) + 1).padStart(5, "0")}`,
          status: ContractStatus.SIGNED,
          signedAt: leaseData.startDate,
          fileUrl: `/contracts/${lease.id}.pdf`,
        },
      });

      for (let i = 0; i < 2; i++) {
        const settleMonth = addMonths(today, -3 + i);
        await prisma.settlement.create({
          data: {
            leaseId: lease.id,
            settlementNo: `SETTLE${format(settleMonth, "yyyyMM")}${String(leases.indexOf(lease) + 1).padStart(3, "0")}`,
            periodFrom: startOfMonth(settleMonth),
            periodTo: endOfMonth(settleMonth),
            totalRent: leaseData.monthlyRent,
            managementFee: Math.floor(leaseData.monthlyRent * 0.08),
            ownerAmount: Math.floor(leaseData.monthlyRent * 0.92),
            status: i === 0 ? SettlementStatus.CONFIRMED : SettlementStatus.PAID,
            paidDate: i === 1 ? addDays(endOfMonth(settleMonth), 5) : null,
          },
        });
      }
    }
  }

  await prisma.assignment.createMany({
    data: [
      {
        leaseId: leases[1].id,
        type: AssignmentType.REPAIR,
        priority: Priority.MEDIUM,
        assigneeId: frontlineUser2.id,
        title: "空调维修",
        description: "租客反馈空调制冷效果不佳，需安排维修。",
        status: AssignmentStatus.PENDING,
      },
      {
        leaseId: leases[2].id,
        type: AssignmentType.VISIT,
        priority: Priority.LOW,
        assigneeId: frontlineUser1.id,
        title: "租客回访",
        description: "租约即将到期，回访租客是否续约。",
        status: AssignmentStatus.PENDING,
      },
      {
        leaseId: leases[3].id,
        type: AssignmentType.COMPLAINT,
        priority: Priority.URGENT,
        assigneeId: frontlineUser2.id,
        title: "噪音投诉处理",
        description: "相邻公司投诉该租户夜间加班噪音过大。",
        status: AssignmentStatus.IN_PROGRESS,
      },
      {
        leaseId: leases[0].id,
        type: AssignmentType.VISIT,
        priority: Priority.LOW,
        assigneeId: frontlineUser1.id,
        title: "日常巡检",
        description: "定期巡检房源使用情况。",
        status: AssignmentStatus.COMPLETED,
        handleNote: "房源状态良好，租客无其他需求。",
        satisfactionScore: 5,
        completedAt: subDays(today, 3),
      },
      {
        leaseId: leases[5].id,
        type: AssignmentType.REPAIR,
        priority: Priority.HIGH,
        assigneeId: frontlineUser2.id,
        title: "门禁系统故障",
        description: "租客反映门禁刷卡失效，需紧急处理。",
        status: AssignmentStatus.COMPLETED,
        handleNote: "已更换门禁读卡器，测试正常。",
        satisfactionScore: 4,
        completedAt: subDays(today, 1),
      },
    ],
  });

  const changeRecords = await prisma.changeRecord.createManyAndReturn({
    data: [
      {
        entityType: "LEASE",
        entityId: leases[0].id,
        fieldName: "monthlyRent",
        oldValue: "25000",
        newValue: "28000",
        operatorId: adminUser.id,
        reason: "租金调整",
        changedAt: subDays(today, 30),
      },
      {
        entityType: "LEASE",
        entityId: leases[0].id,
        fieldName: "status",
        oldValue: "PENDING",
        newValue: "ACTIVE",
        operatorId: adminUser.id,
        reason: "租约生效",
        changedAt: subDays(today, 25),
      },
      {
        entityType: "LEASE",
        entityId: leases[1].id,
        fieldName: "paymentDay",
        oldValue: "5",
        newValue: "10",
        operatorId: financeUser.id,
        reason: "租客申请调整付款日",
        changedAt: subDays(today, 20),
      },
      {
        entityType: "BILL",
        entityId: "bill_001",
        fieldName: "status",
        oldValue: "UNPAID",
        newValue: "PAID",
        operatorId: financeUser.id,
        reason: "收到租金",
        changedAt: subDays(today, 15),
      },
      {
        entityType: "BILL",
        entityId: "bill_002",
        fieldName: "paidAmount",
        oldValue: "0",
        newValue: "32000",
        operatorId: financeUser.id,
        reason: "全额支付",
        changedAt: subDays(today, 12),
      },
      {
        entityType: "BILL",
        entityId: "bill_003",
        fieldName: "status",
        oldValue: "UNPAID",
        newValue: "OVERDUE",
        operatorId: financeUser.id,
        reason: "租金逾期",
        changedAt: subDays(today, 10),
      },
      {
        entityType: "ASSIGNMENT",
        entityId: "assign_001",
        fieldName: "status",
        oldValue: "PENDING",
        newValue: "IN_PROGRESS",
        operatorId: frontlineUser1.id,
        reason: "开始处理",
        changedAt: subDays(today, 8),
      },
      {
        entityType: "ASSIGNMENT",
        entityId: "assign_001",
        fieldName: "handleNote",
        oldValue: null,
        newValue: "已联系租客，安排维修时间",
        operatorId: frontlineUser1.id,
        reason: "更新处理进度",
        changedAt: subDays(today, 7),
      },
      {
        entityType: "ASSIGNMENT",
        entityId: "assign_001",
        fieldName: "status",
        oldValue: "IN_PROGRESS",
        newValue: "COMPLETED",
        operatorId: frontlineUser1.id,
        reason: "维修完成",
        changedAt: subDays(today, 5),
      },
      {
        entityType: "ASSIGNMENT",
        entityId: "assign_001",
        fieldName: "satisfactionScore",
        oldValue: null,
        newValue: "5",
        operatorId: frontlineUser1.id,
        reason: "租客满意度评价",
        changedAt: subDays(today, 4),
      },
      {
        entityType: "SETTLEMENT",
        entityId: "settle_001",
        fieldName: "status",
        oldValue: "PENDING",
        newValue: "CONFIRMED",
        operatorId: financeUser.id,
        reason: "财务确认结算",
        changedAt: subDays(today, 3),
      },
      {
        entityType: "SETTLEMENT",
        entityId: "settle_001",
        fieldName: "status",
        oldValue: "CONFIRMED",
        newValue: "PAID",
        operatorId: financeUser.id,
        reason: "已付款给业主",
        changedAt: subDays(today, 2),
      },
      {
        entityType: "CONTRACT",
        entityId: "contract_001",
        fieldName: "status",
        oldValue: "DRAFT",
        newValue: "PENDING_SIGN",
        operatorId: adminUser.id,
        reason: "提交签署",
        changedAt: subDays(today, 6),
      },
      {
        entityType: "CONTRACT",
        entityId: "contract_001",
        fieldName: "status",
        oldValue: "PENDING_SIGN",
        newValue: "SIGNED",
        operatorId: adminUser.id,
        reason: "双方已签署",
        changedAt: subDays(today, 1),
      },
      {
        entityType: "LEASE",
        entityId: leases[2].id,
        fieldName: "endDate",
        oldValue: "2024-06-30T00:00:00.000Z",
        newValue: "2025-06-30T00:00:00.000Z",
        operatorId: adminUser.id,
        reason: "续约一年",
        changedAt: subDays(today, 1),
      },
      {
        entityType: "BILL",
        entityId: "bill_004",
        fieldName: "paymentMethod",
        oldValue: null,
        newValue: "银行转账",
        operatorId: financeUser.id,
        reason: "更新支付方式",
        changedAt: subDays(today, 1),
      },
      {
        entityType: "ASSIGNMENT",
        entityId: "assign_002",
        fieldName: "priority",
        oldValue: "MEDIUM",
        newValue: "HIGH",
        operatorId: adminUser.id,
        reason: "升级优先级",
        changedAt: new Date(),
      },
      {
        entityType: "LEASE",
        entityId: leases[3].id,
        fieldName: "deposit",
        oldValue: "80000",
        newValue: "90000",
        operatorId: adminUser.id,
        reason: "调整押金金额",
        changedAt: new Date(),
      },
      {
        entityType: "SETTLEMENT",
        entityId: "settle_002",
        fieldName: "managementFee",
        oldValue: "2000",
        newValue: "2500",
        operatorId: financeUser.id,
        reason: "管理费率调整",
        changedAt: new Date(),
      },
      {
        entityType: "BILL",
        entityId: "bill_005",
        fieldName: "amount",
        oldValue: "28000",
        newValue: "28500",
        operatorId: financeUser.id,
        reason: "增加物业费",
        changedAt: new Date(),
      },
    ],
  });

  console.log("Mock 数据生成完成！");
  console.log(`创建了 ${users.length} 个用户`);
  console.log(`创建了 ${owners.length} 个业主`);
  console.log(`创建了 ${properties.length} 个房源`);
  console.log(`创建了 ${tenants.length} 个租客`);
  console.log(`创建了 ${leases.length} 个租约`);
  console.log(`创建了 ${changeRecords.length} 条变更记录`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
