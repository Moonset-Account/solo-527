import { PrismaClient } from "@prisma/client";
import { hashPassword } from "@/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("开始初始化数据库...");

  const adminRole = await prisma.userRole.upsert({
    where: { id: "role-admin" },
    update: {},
    create: {
      id: "role-admin",
      roleName: "系统管理员",
      roleCode: "ADMIN",
      permissions: ["*"],
      description: "拥有所有权限",
    },
  });

  const analystRole = await prisma.userRole.upsert({
    where: { id: "role-analyst" },
    update: {},
    create: {
      id: "role-analyst",
      roleName: "运营分析员",
      roleCode: "ANALYST",
      permissions: ["dashboard:view", "data:import", "data:export", "annotation:manage"],
      description: "数据分析和导出权限",
    },
  });

  const deptInternal = await prisma.department.upsert({
    where: { id: "dept-001" },
    update: {},
    create: {
      id: "dept-001",
      deptCode: "INTERNAL",
      deptName: "内科",
      deptType: "clinical",
      isActive: true,
      sortOrder: 1,
    },
  });

  const deptSurgery = await prisma.department.upsert({
    where: { id: "dept-002" },
    update: {},
    create: {
      id: "dept-002",
      deptCode: "SURGERY",
      deptName: "外科",
      deptType: "clinical",
      isActive: true,
      sortOrder: 2,
    },
  });

  const deptPediatrics = await prisma.department.upsert({
    where: { id: "dept-003" },
    update: {},
    create: {
      id: "dept-003",
      deptCode: "PEDIATRICS",
      deptName: "儿科",
      deptType: "clinical",
      isActive: true,
      sortOrder: 3,
    },
  });

  const deptObstetrics = await prisma.department.upsert({
    where: { id: "dept-004" },
    update: {},
    create: {
      id: "dept-004",
      deptCode: "OBSTETRICS",
      deptName: "妇产科",
      deptType: "clinical",
      isActive: true,
      sortOrder: 4,
    },
  });

  const deptOphthalmology = await prisma.department.upsert({
    where: { id: "dept-005" },
    update: {},
    create: {
      id: "dept-005",
      deptCode: "OPHTHALMOLOGY",
      deptName: "眼科",
      deptType: "clinical",
      isActive: true,
      sortOrder: 5,
    },
  });

  const ptNormal = await prisma.patientType.upsert({
    where: { id: "pt-001" },
    update: {},
    create: {
      id: "pt-001",
      typeCode: "NORMAL",
      typeName: "普通患者",
      isActive: true,
      sortOrder: 1,
    },
  });

  const ptEmergency = await prisma.patientType.upsert({
    where: { id: "pt-002" },
    update: {},
    create: {
      id: "pt-002",
      typeCode: "EMERGENCY",
      typeName: "急诊患者",
      isActive: true,
      sortOrder: 2,
    },
  });

  const ptVip = await prisma.patientType.upsert({
    where: { id: "pt-003" },
    update: {},
    create: {
      id: "pt-003",
      typeCode: "VIP",
      typeName: "VIP患者",
      isActive: true,
      sortOrder: 3,
    },
  });

  const hashedPassword = await hashPassword("admin123");

  const adminUser = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      username: "admin",
      passwordHash: hashedPassword,
      realName: "系统管理员",
      roleId: adminRole.id,
      email: "admin@hospital.com",
      phone: "13800138000",
      departmentScopes: [],
      isActive: true,
    },
  });

  const analystPassword = await hashPassword("analyst123");
  const analystUser = await prisma.user.upsert({
    where: { username: "analyst" },
    update: {
      passwordHash: analystPassword,
    },
    create: {
      username: "analyst",
      passwordHash: analystPassword,
      realName: "运营分析员",
      roleId: analystRole.id,
      email: "analyst@hospital.com",
      phone: "13800138001",
      departmentScopes: ["dept-001", "dept-002"],
      isActive: true,
    },
  });

  console.log("数据库初始化完成!");
  console.log("");
  console.log("默认账号:");
  console.log("  管理员: admin / admin123 (全部科室权限)");
  console.log("  分析员: analyst / analyst123 (仅内科、外科权限)");
  console.log("");
  console.log("科室数据:");
  console.log("  - 内科 (dept-001)");
  console.log("  - 外科 (dept-002)");
  console.log("  - 儿科 (dept-003)");
  console.log("  - 妇产科 (dept-004)");
  console.log("  - 眼科 (dept-005)");
  console.log("");
  console.log("患者类型:");
  console.log("  - 普通患者 (pt-001)");
  console.log("  - 急诊患者 (pt-002)");
  console.log("  - VIP患者 (pt-003)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
