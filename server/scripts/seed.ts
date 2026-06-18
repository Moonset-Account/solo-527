import mongoose from "mongoose";
import Technician from "../models/Technician.js";
import Treatment from "../models/Treatment.js";
import Customer from "../models/Customer.js";
import Consultant from "../models/Consultant.js";
import Material from "../models/Material.js";
import Schedule from "../models/Schedule.js";
import ReminderRule from "../models/ReminderRule.js";
import dayjs from "dayjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/beauty_salon";

async function seed() {
  console.log("🌱 开始初始化种子数据...");

  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB connected");

  await Promise.all([
    Technician.deleteMany({}),
    Treatment.deleteMany({}),
    Customer.deleteMany({}),
    Consultant.deleteMany({}),
    Material.deleteMany({}),
    Schedule.deleteMany({}),
    ReminderRule.deleteMany({}),
  ]);
  console.log("🗑️  已清空原有数据");

  const technicians = await Technician.insertMany([
    {
      name: "李小花",
      phone: "13800138001",
      level: "高级",
      specialties: ["面部护理", "身体SPA"],
      status: "在职",
      baseSalary: 5000,
      commissionRate: 0.12,
      hireDate: new Date("2022-03-15"),
      remark: "资深技师，技术精湛",
    },
    {
      name: "王美丽",
      phone: "13800138002",
      level: "中级",
      specialties: ["美甲", "美睫"],
      status: "在职",
      baseSalary: 4000,
      commissionRate: 0.1,
      hireDate: new Date("2023-01-10"),
    },
    {
      name: "张优雅",
      phone: "13800138003",
      level: "技师长",
      specialties: ["面部护理", "身体护理", "纹绣"],
      status: "在职",
      baseSalary: 8000,
      commissionRate: 0.15,
      hireDate: new Date("2020-06-01"),
      remark: "店长指定特级技师",
    },
    {
      name: "陈温柔",
      phone: "13800138004",
      level: "初级",
      specialties: ["基础护理"],
      status: "在职",
      baseSalary: 3000,
      commissionRate: 0.08,
      hireDate: new Date("2024-01-15"),
    },
    {
      name: "刘婷婷",
      phone: "13800138005",
      level: "中级",
      specialties: ["身体SPA", "精油按摩"],
      status: "休假",
      baseSalary: 4200,
      commissionRate: 0.1,
      hireDate: new Date("2022-08-20"),
    },
  ]);
  console.log(`👩 已创建 ${technicians.length} 名技师`);

  const treatments = await Treatment.insertMany([
    {
      name: "深层清洁面部护理",
      category: "面部护理",
      duration: 60,
      price: 298,
      cost: 80,
      description: "深层清洁毛孔，补水保湿",
      status: "上架",
      sortOrder: 1,
    },
    {
      name: "补水嫩肤护理",
      category: "面部护理",
      duration: 90,
      price: 498,
      cost: 150,
      description: "深层补水，提亮肤色",
      status: "上架",
      sortOrder: 2,
    },
    {
      name: "全身精油SPA",
      category: "身体护理",
      duration: 120,
      price: 698,
      cost: 200,
      description: "全身精油按摩，舒缓放松",
      status: "上架",
      sortOrder: 3,
    },
    {
      name: "背部疏通护理",
      category: "身体护理",
      duration: 60,
      price: 368,
      cost: 100,
      description: "背部经络疏通",
      status: "上架",
      sortOrder: 4,
    },
    {
      name: "日式美甲",
      category: "美甲美睫",
      duration: 90,
      price: 258,
      cost: 60,
      description: "日式精致美甲",
      status: "上架",
      sortOrder: 5,
    },
    {
      name: "嫁接睫毛",
      category: "美甲美睫",
      duration: 120,
      price: 398,
      cost: 80,
      description: "浓密款睫毛嫁接",
      status: "上架",
      sortOrder: 6,
    },
    {
      name: "抗衰老紧致护理",
      category: "面部护理",
      duration: 120,
      price: 998,
      cost: 300,
      description: "紧致抗衰，淡化细纹",
      status: "上架",
      sortOrder: 7,
    },
    {
      name: "足部护理",
      category: "身体护理",
      duration: 45,
      price: 158,
      cost: 40,
      description: "足部保养护理",
      status: "下架",
      sortOrder: 8,
    },
  ]);
  console.log(`💆 已创建 ${treatments.length} 个疗程项目`);

  const customers = await Customer.insertMany([
    {
      name: "张女士",
      phone: "13900139001",
      gender: "女",
      level: "金卡",
      balance: 2000,
      points: 5000,
      source: "美团",
      tags: ["老客户", "高消费"],
      birthday: new Date("1990-05-15"),
    },
    {
      name: "李女士",
      phone: "13900139002",
      gender: "女",
      level: "银卡",
      balance: 800,
      points: 2000,
      source: "转介绍",
      tags: ["周末常客"],
    },
    {
      name: "王女士",
      phone: "13900139003",
      gender: "女",
      level: "钻石",
      balance: 5000,
      points: 15000,
      source: "门店",
      tags: ["VIP", "高消费"],
    },
    {
      name: "赵女士",
      phone: "13900139004",
      gender: "女",
      level: "普通",
      balance: 0,
      points: 500,
      source: "大众点评",
    },
    {
      name: "陈女士",
      phone: "13900139005",
      gender: "女",
      level: "银卡",
      balance: 500,
      points: 1800,
      source: "门店",
    },
  ]);
  console.log(`👥 已创建 ${customers.length} 位客户`);

  const consultants = await Consultant.insertMany([
    {
      name: "周顾问",
      phone: "13700137001",
      level: "高级顾问",
      status: "在职",
      baseSalary: 4500,
      commissionRate: 0.06,
    },
    {
      name: "吴顾问",
      phone: "13700137002",
      level: "顾问主管",
      status: "在职",
      baseSalary: 6000,
      commissionRate: 0.08,
    },
    {
      name: "郑顾问",
      phone: "13700137003",
      level: "初级顾问",
      status: "在职",
      baseSalary: 3500,
      commissionRate: 0.04,
    },
  ]);
  console.log(`👩‍💼 已创建 ${consultants.length} 名顾问`);

  const materials = await Material.insertMany([
    {
      name: "玻尿酸精华液",
      sku: "MAT-001",
      category: "护肤品",
      unit: "瓶",
      price: 298,
      cost: 120,
      stock: 50,
      minStock: 20,
      supplier: "某品牌供应商",
      status: "启用",
    },
    {
      name: "按摩精油",
      sku: "MAT-002",
      category: "精油",
      unit: "瓶",
      price: 168,
      cost: 60,
      stock: 30,
      minStock: 10,
      status: "启用",
    },
    {
      name: "一次性床单",
      sku: "MAT-003",
      category: "耗材",
      unit: "包",
      price: 35,
      cost: 15,
      stock: 100,
      minStock: 30,
      status: "启用",
    },
    {
      name: "面膜粉",
      sku: "MAT-004",
      category: "护肤品",
      unit: "盒",
      price: 198,
      cost: 80,
      stock: 25,
      minStock: 15,
      status: "启用",
    },
    {
      name: "甲油胶",
      sku: "MAT-005",
      category: "耗材",
      unit: "瓶",
      price: 88,
      cost: 35,
      stock: 8,
      minStock: 10,
      status: "启用",
    },
  ]);
  console.log(`📦 已创建 ${materials.length} 种耗材`);

  const shiftTimes = {
    早班: { startTime: "09:00", endTime: "18:00", breakStartTime: "12:00", breakEndTime: "13:00" },
    中班: { startTime: "11:00", endTime: "20:00", breakStartTime: "14:00", breakEndTime: "15:00" },
    晚班: { startTime: "14:00", endTime: "22:00", breakStartTime: "17:00", breakEndTime: "18:00" },
    全天: { startTime: "09:00", endTime: "22:00", breakStartTime: "12:00", breakEndTime: "14:00" },
  };

  const scheduleData: any[] = [];
  const shiftTypes = ["早班", "中班", "晚班", "全天", "休息"];
  const techNames = technicians.map((t) => ({ id: t._id, name: t.name }));

  for (let i = 0; i < 14; i++) {
    const date = dayjs().add(i, "day").toDate();
    for (const tech of techNames) {
      if (tech.name === "刘婷婷") continue;
      const shiftIndex = Math.floor(Math.random() * 5);
      const shiftType = shiftTypes[shiftIndex];
      const times = shiftTimes[shiftType] || {};
      scheduleData.push({
        technicianId: tech.id,
        technicianName: tech.name,
        date,
        shiftType,
        ...times,
        createdBy: "system",
      });
    }
  }

  const schedules = await Schedule.insertMany(scheduleData);
  console.log(`📅 已创建 ${schedules.length} 条排班记录`);

  const reminderRules = await ReminderRule.insertMany([
    {
      name: "技师请假审批提醒",
      type: "技师请假",
      enabled: true,
      levels: [
        {
          level: "普通",
          triggerCondition: "提交请假申请",
          triggerValue: 0,
          triggerUnit: "小时",
          notifyChannels: ["系统消息"],
          notifyRoles: ["店长"],
          repeatInterval: 0,
          maxRepeats: 1,
        },
        {
          level: "紧急",
          triggerCondition: "请假申请超过2小时未处理",
          triggerValue: 2,
          triggerUnit: "小时",
          notifyChannels: ["系统消息", "短信"],
          notifyRoles: ["店长"],
          repeatInterval: 2,
          maxRepeats: 3,
        },
        {
          level: "超时升级",
          triggerCondition: "请假申请超过8小时未处理",
          triggerValue: 8,
          triggerUnit: "小时",
          notifyChannels: ["系统消息", "短信"],
          notifyRoles: ["店长", "区域经理"],
          repeatInterval: 4,
          maxRepeats: 5,
        },
      ],
      description: "技师请假申请的分级提醒规则",
      createdBy: "admin",
    },
    {
      name: "预约提醒",
      type: "预约提醒",
      enabled: true,
      levels: [
        {
          level: "普通",
          triggerCondition: "预约前1天",
          triggerValue: 24,
          triggerUnit: "小时",
          notifyChannels: ["系统消息"],
          notifyRoles: ["技师", "客户"],
        },
      ],
      description: "预约前的提醒通知",
      createdBy: "admin",
    },
    {
      name: "耗材库存预警",
      type: "耗材库存",
      enabled: true,
      levels: [
        {
          level: "普通",
          triggerCondition: "低于最低库存",
          triggerValue: 1,
          triggerUnit: "倍",
          notifyChannels: ["系统消息"],
          notifyRoles: ["店长"],
        },
        {
          level: "紧急",
          triggerCondition: "低于最低库存的50%",
          triggerValue: 0.5,
          triggerUnit: "倍",
          notifyChannels: ["系统消息", "短信"],
          notifyRoles: ["店长"],
        },
      ],
      description: "耗材库存不足的预警规则",
      createdBy: "admin",
    },
  ]);
  console.log(`🔔 已创建 ${reminderRules.length} 条提醒规则`);

  console.log("\n🎉 种子数据初始化完成！");
  console.log("   - 技师：5 名");
  console.log("   - 疗程项目：8 个");
  console.log("   - 客户：5 位");
  console.log("   - 顾问：3 名");
  console.log("   - 耗材：5 种");
  console.log("   - 排班：约 14 天 × 4 名技师");
  console.log("   - 提醒规则：3 条");

  await mongoose.disconnect();
  console.log("\n👋 数据库连接已关闭");
}

seed().catch((err) => {
  console.error("❌ 初始化失败:", err);
  process.exit(1);
});
