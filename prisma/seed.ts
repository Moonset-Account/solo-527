import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("开始初始化数据库...");

  const adminRole = await prisma.userRole.upsert({
    where: { roleName: "系统管理员" },
    update: {},
    create: {
      roleName: "系统管理员",
      permissions: ["*"],
    },
  });

  const analystRole = await prisma.userRole.upsert({
    where: { roleName: "运营分析员" },
    update: {},
    create: {
      roleName: "运营分析员",
      permissions: ["dashboard:view", "data:import", "data:export", "annotation:manage"],
    },
  });

  const deptInternal = await prisma.department.upsert({
    where: { deptCode: "INTERNAL" },
    update: {},
    create: {
      deptCode: "INTERNAL",
      deptName: "内科",
      isActive: true,
    },
  });

  const deptSurgery = await prisma.department.upsert({
    where: { deptCode: "SURGERY" },
    update: {},
    create: {
      deptCode: "SURGERY",
      deptName: "外科",
      isActive: true,
    },
  });

  const deptPediatrics = await prisma.department.upsert({
    where: { deptCode: "PEDIATRICS" },
    update: {},
    create: {
      deptCode: "PEDIATRICS",
      deptName: "儿科",
      isActive: true,
    },
  });

  const deptObstetrics = await prisma.department.upsert({
    where: { deptCode: "OBSTETRICS" },
    update: {},
    create: {
      deptCode: "OBSTETRICS",
      deptName: "妇产科",
      isActive: true,
    },
  });

  const deptOphthalmology = await prisma.department.upsert({
    where: { deptCode: "OPHTHALMOLOGY" },
    update: {},
    create: {
      deptCode: "OPHTHALMOLOGY",
      deptName: "眼科",
      isActive: true,
    },
  });

  const ptNormal = await prisma.patientType.upsert({
    where: { typeCode: "NORMAL" },
    update: {},
    create: {
      typeCode: "NORMAL",
      typeName: "普通患者",
      isActive: true,
    },
  });

  const ptEmergency = await prisma.patientType.upsert({
    where: { typeCode: "EMERGENCY" },
    update: {},
    create: {
      typeCode: "EMERGENCY",
      typeName: "急诊患者",
      isActive: true,
    },
  });

  const ptVip = await prisma.patientType.upsert({
    where: { typeCode: "VIP" },
    update: {},
    create: {
      typeCode: "VIP",
      typeName: "VIP患者",
      isActive: true,
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
      realNameMasked: "**员",
      roleId: adminRole.id,
      departmentScopes: [],
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
      realNameMasked: "**员",
      roleId: analystRole.id,
      departmentScopes: [deptInternal.id, deptSurgery.id],
    },
  });

  console.log("数据库初始化完成!");
  console.log("");
  console.log("默认账号:");
  console.log("  管理员: admin / admin123 (全部科室权限)");
  console.log("  分析员: analyst / analyst123 (仅内科、外科权限)");
  console.log("");
  console.log("科室数据:");
  console.log(`  - 内科 (${deptInternal.id})`);
  console.log(`  - 外科 (${deptSurgery.id})`);
  console.log(`  - 儿科 (${deptPediatrics.id})`);
  console.log(`  - 妇产科 (${deptObstetrics.id})`);
  console.log(`  - 眼科 (${deptOphthalmology.id})`);
  console.log("");
  console.log("患者类型:");
  console.log(`  - 普通患者 (${ptNormal.id})`);
  console.log(`  - 急诊患者 (${ptEmergency.id})`);
  console.log(`  - VIP患者 (${ptVip.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
