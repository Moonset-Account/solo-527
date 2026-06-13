import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await Promise.all([
    prisma.user.upsert({
      where: { clerkId: "clerk_admin_001" },
      update: {},
      create: {
        clerkId: "clerk_admin_001",
        name: "张管理",
        email: "admin@qinghe.com",
        role: "ADMIN",
      },
    }),
    prisma.user.upsert({
      where: { clerkId: "clerk_op_001" },
      update: {},
      create: {
        clerkId: "clerk_op_001",
        name: "李运营",
        email: "liyunying@qinghe.com",
        role: "OPERATOR",
      },
    }),
    prisma.user.upsert({
      where: { clerkId: "clerk_op_002" },
      update: {},
      create: {
        clerkId: "clerk_op_002",
        name: "王工程",
        email: "wanggc@qinghe.com",
        role: "OPERATOR",
      },
    }),
  ]);

  const adminId = users[0].id;
  const op1Id = users[1].id;
  const op2Id = users[2].id;

  const buildings = await Promise.all([
    prisma.building.upsert({
      where: { id: "bld_1" },
      update: {},
      create: { id: "bld_1", name: "青禾大厦 A座", floors: 12, address: "青禾路 88 号" },
    }),
    prisma.building.upsert({
      where: { id: "bld_2" },
      update: {},
      create: { id: "bld_2", name: "青禾大厦 B座", floors: 8, address: "青禾路 88 号" },
    }),
  ]);

  const industries = ["信息技术", "生物医药", "新能源", "智能制造", "文创设计", "跨境电商"];
  const tenantNames = [
    { name: "云智科技有限公司", contact: "陈总", phone: "13800001001", industry: "信息技术" },
    { name: "绿康生物科技", contact: "刘经理", phone: "13800001002", industry: "生物医药" },
    { name: "明源新能源", contact: "赵总", phone: "13800001003", industry: "新能源" },
    { name: "精工智造科技", contact: "孙工", phone: "13800001004", industry: "智能制造" },
    { name: "青禾文创设计", contact: "周总监", phone: "13800001005", industry: "文创设计" },
    { name: "环球优选电商", contact: "吴总", phone: "13800001006", industry: "跨境电商" },
    { name: "慧通数据服务", contact: "郑经理", phone: "13800001007", industry: "信息技术" },
    { name: "康泰医疗设备", contact: "钱工", phone: "13800001008", industry: "生物医药" },
  ];

  const tenants: any[] = [];
  for (let i = 0; i < tenantNames.length; i++) {
    const t = await prisma.tenant.upsert({
      where: { id: `tenant_${i + 1}` },
      update: {},
      create: {
        id: `tenant_${i + 1}`,
        ...tenantNames[i],
        email: `contact${i + 1}@company.com`,
      },
    });
    tenants.push(t);
  }

  const statuses = ["OCCUPIED", "VACANT", "MAINTENANCE"];
  const rooms: any[] = [];
  for (let b = 0; b < 2; b++) {
    const bld = buildings[b];
    const floors = b === 0 ? 12 : 8;
    let roomCount = 0;
    for (let f = 1; f <= floors; f++) {
      const units = f === 1 ? 3 : 5;
      for (let u = 1; u <= units; u++) {
        const idx = roomCount;
        const tIdx = idx % (tenants.length + 3);
        const isOccupied = tIdx < tenants.length;
        const isMaintenance = !isOccupied && idx % 7 === 0;
        const status = isOccupied ? "OCCUPIED" : isMaintenance ? "MAINTENANCE" : "VACANT";
        const tenantId = isOccupied ? tenants[tIdx].id : null;
        const price = 80 + Math.floor(Math.random() * 40);
        const room = await prisma.room.upsert({
          where: { id: `room_b${b + 1}_${f}_${u}` },
          update: {},
          create: {
            id: `room_b${b + 1}_${f}_${u}`,
            buildingId: bld.id,
            floor: String(f),
            unitNumber: `${f}0${u}`,
            area: 60 + Math.floor(Math.random() * 180),
            price: price,
            status,
            tenantId,
          },
        });
        rooms.push(room);
        roomCount++;
      }
    }
  }

  const occupiedRooms = rooms.filter((r) => r.status === "OCCUPIED");
  for (let i = 0; i < Math.min(6, occupiedRooms.length, tenants.length); i++) {
    const room = occupiedRooms[i];
    const tenant = tenants[i];
    await prisma.contract.upsert({
      where: { id: `contract_${i + 1}` },
      update: {},
      create: {
        id: `contract_${i + 1}`,
        tenantId: tenant.id,
        roomId: room.id,
        startDate: new Date(2025, 0, 1),
        endDate: new Date(2026, 11, 31),
        monthlyRent: room.price * room.area,
      },
    });
  }

  const serviceTypes = ["空调维修", "门禁申请", "会议预订", "保洁服务", "停车月卡", "网络故障"];
  const serviceStatuses = ["PENDING", "APPROVED", "COMPLETED", "REJECTED"];
  for (let i = 0; i < 20; i++) {
    const tIdx = i % tenants.length;
    const sIdx = i % serviceTypes.length;
    const status = serviceStatuses[i % serviceStatuses.length];
    const createdAt = new Date(Date.now() - Math.random() * 30 * 86400000);
    const sr = await prisma.serviceRequest.create({
      data: {
        tenantId: tenants[tIdx].id,
        requesterId: i % 3 === 0 ? op1Id : op2Id,
        type: serviceTypes[sIdx],
        description: `${serviceTypes[sIdx]}申请 - 房间需要${serviceTypes[sIdx]}服务，请尽快处理。`,
        status,
        assigneeId: status === "APPROVED" || status === "COMPLETED" ? (i % 2 === 0 ? op1Id : op2Id) : null,
        rejectReason: status === "REJECTED" ? "该服务不在当前合同范围内" : null,
        createdAt,
      },
    });
    type Flow = { from: string | null; to: string; note: string; delay: number };
    const flows: Flow[] = [
      { from: null, to: "PENDING", note: "提交服务申请", delay: 0 },
    ];
    if (status !== "PENDING") {
      flows.push({ from: "PENDING", to: status, note: status === "APPROVED" ? "审批通过，已分配" : status === "COMPLETED" ? "处理完成" : `驳回：${sr.rejectReason}`, delay: 3600000 });
    }
    if (status === "COMPLETED") {
      flows.splice(flows.length - 1, 0, { from: "PENDING", to: "APPROVED", note: "审批通过", delay: 3600000 });
    }
    for (const flow of flows) {
      await prisma.serviceStatusLog.create({
        data: {
          serviceRequestId: sr.id,
          fromStatus: flow.from,
          toStatus: flow.to,
          operatorId: adminId,
          note: flow.note,
          createdAt: new Date(createdAt.getTime() + flow.delay),
        },
      });
    }
  }

  const billItems = ["租金", "物业管理费", "电费", "水费", "空调费", "网络费"];
  const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
  for (let m = 0; m < months.length; m++) {
    for (let i = 0; i < Math.min(5, tenants.length); i++) {
      const tenant = tenants[i];
      const tRooms = rooms.filter((r) => r.tenantId === tenant.id);
      if (tRooms.length === 0) continue;
      const room = tRooms[0];
      const items = billItems.slice(0, 3 + (i % 3));
      const itemsData = items.map((name) => ({
        name,
        amount: name === "租金" ? room.price * room.area : 200 + Math.floor(Math.random() * 2000),
        category: ["租金", "物业管理费"].includes(name) ? "固定" : "浮动",
      }));
      const total = itemsData.reduce((s, it) => s + it.amount, 0);
      const status = m < 4 ? "PAID" : m === 4 ? (i % 2 === 0 ? "PAID" : "PENDING") : "PENDING";
      const dueDate = new Date(2026, m + 1, 15);
      const bill = await prisma.bill.create({
        data: {
          tenantId: tenant.id,
          roomId: room.id,
          period: months[m],
          totalAmount: total,
          status,
          dueDate,
          paidAt: status === "PAID" ? new Date(dueDate.getTime() - 3 * 86400000) : null,
          creatorId: adminId,
          items: { create: itemsData },
        },
      });
      if (status === "PAID") {
        await prisma.auditLog.create({
          data: {
            entityType: "Bill",
            entityId: bill.id,
            field: "status",
            oldValue: "PENDING",
            newValue: "PAID",
            operatorId: adminId,
            operatedAt: new Date(dueDate.getTime() - 3 * 86400000),
          },
        });
      }
    }
  }

  const urgencies = ["HIGH", "MEDIUM", "LOW"];
  const repairStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED"];
  const repairDescriptions = [
    "办公室空调不制冷，温度居高不下",
    "卫生间漏水，需紧急维修",
    "电梯偶发故障，运行有异响",
    "照明灯闪烁，疑似线路问题",
    "门禁卡无法刷卡开门",
    "窗户密封胶老化，雨天漏水",
  ];
  for (let i = 0; i < 15; i++) {
    const rIdx = i % occupiedRooms.length;
    const room = occupiedRooms[rIdx];
    const status = repairStatuses[i % repairStatuses.length];
    const urgency = urgencies[i % urgencies.length];
    await prisma.repair.create({
      data: {
        tenantId: room.tenantId || tenants[i % tenants.length].id,
        roomId: room.id,
        reporterId: i % 3 === 0 ? adminId : op1Id,
        description: repairDescriptions[i % repairDescriptions.length],
        urgency,
        status,
        assigneeId: status !== "PENDING" ? op2Id : null,
        result: status === "RESOLVED" ? "问题已排查并修复，测试运行正常。" : null,
        resolvedAt: status === "RESOLVED" ? new Date(Date.now() - Math.random() * 5 * 86400000) : null,
        createdAt: new Date(Date.now() - Math.random() * 14 * 86400000),
      },
    });
  }

  const areas = ["A座 1-3层公共区域", "A座 4-8层公共区域", "B座全楼公共区域", "地下车库", "园区外墙及绿化", "配电房/机房"];
  const checklist = [
    "消防设施完好",
    "应急照明正常",
    "通道无阻塞",
    "地面清洁",
    "指示牌清晰",
    "门窗完好",
    "空调运行正常",
    "电梯运行正常",
  ];
  for (let i = 0; i < 8; i++) {
    const area = areas[i % areas.length];
    const items = checklist.map((item, idx) => ({
      item,
      passed: !(i === 3 && idx === 2) && !(i === 5 && idx === 0) && Math.random() > 0.05,
      note: (i === 3 && idx === 2) ? "通道堆放杂物，需清理" : (i === 5 && idx === 0) ? "灭火器压力不足" : null,
    }));
    const inspectedAt = new Date(Date.now() - i * 2 * 86400000);
    const hasFailed = items.some((c) => !c.passed);
    const insp = await prisma.inspection.create({
      data: {
        area,
        inspectorId: i % 2 === 0 ? op1Id : op2Id,
        inspectedAt,
        status: hasFailed ? "HAS_ANOMALY" : "COMPLETED",
        items: { create: items },
      },
    });
    if (hasFailed) {
      const failed = items.filter((c) => !c.passed);
      await prisma.anomaly.create({
        data: {
          inspectionId: insp.id,
          affectedObjects: failed.map((c) => c.item).join("、"),
          handlerId: i % 2 === 0 ? op2Id : op1Id,
          followUpAction: `安排工程部整改，${failed.length}项问题，预计3个工作日内完成。`,
          status: i < 4 ? "RESOLVED" : "OPEN",
          resolvedAt: i < 4 ? new Date(inspectedAt.getTime() + 3 * 86400000) : null,
        },
      });
    }
  }

  const changes = [
    { entity: "Tenant", field: "status", old: "ACTIVE", new: "INACTIVE" },
    { entity: "Room", field: "price", old: "100", new: "105" },
    { entity: "Room", field: "status", old: "VACANT", new: "OCCUPIED" },
    { entity: "Room", field: "status", old: "OCCUPIED", new: "MAINTENANCE" },
    { entity: "ServiceRequest", field: "status", old: "PENDING", new: "APPROVED" },
    { entity: "Tenant", field: "contact", old: "陈经理", new: "陈总" },
  ];
  for (let i = 0; i < 30; i++) {
    const c = changes[i % changes.length];
    await prisma.auditLog.create({
      data: {
        entityType: c.entity,
        entityId: `entity_${i}`,
        field: c.field,
        oldValue: c.old,
        newValue: c.new,
        operatorId: i % 4 === 0 ? adminId : i % 2 === 0 ? op1Id : op2Id,
        operatedAt: new Date(Date.now() - i * 86400000 / 3),
      },
    });
  }

  console.log("种子数据插入完成 ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
