import { PrismaClient } from "@prisma/client";
import { UserRole, MachineryType, MachineryStatus } from "@/lib/types";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("开始播种数据...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      realName: "系统管理员",
      phone: "13800000001",
      role: UserRole.INTERNAL,
      village: "镇政府",
    },
  });

  await prisma.user.upsert({
    where: { username: "farmer1" },
    update: {},
    create: {
      username: "farmer1",
      password: hashedPassword,
      realName: "张农户",
      phone: "13800000002",
      role: UserRole.EXTERNAL,
      village: "东庄村",
    },
  });

  await prisma.user.upsert({
    where: { username: "farmer2" },
    update: {},
    create: {
      username: "farmer2",
      password: hashedPassword,
      realName: "李农户",
      phone: "13800000003",
      role: UserRole.EXTERNAL,
      village: "西坡村",
    },
  });

  const machineryData = [
    {
      name: "东方红收割机1号",
      type: MachineryType.HARVESTER,
      plateNumber: "农机001",
      brand: "东方红",
      model: "LX804",
      year: 2020,
      status: MachineryStatus.IDLE,
      fuelCapacity: 200,
      currentFuel: 150,
      efficiency: 8.5,
      purchaseDate: new Date("2020-05-15"),
    },
    {
      name: "东方红收割机2号",
      type: MachineryType.HARVESTER,
      plateNumber: "农机002",
      brand: "东方红",
      model: "LX904",
      year: 2021,
      status: MachineryStatus.IDLE,
      fuelCapacity: 250,
      currentFuel: 200,
      efficiency: 9.2,
      purchaseDate: new Date("2021-03-20"),
    },
    {
      name: "约翰迪尔播种机",
      type: MachineryType.SEEDER,
      plateNumber: "农机003",
      brand: "约翰迪尔",
      model: "6E-1504",
      year: 2022,
      status: MachineryStatus.IDLE,
      fuelCapacity: 300,
      currentFuel: 100,
      efficiency: 12.5,
      purchaseDate: new Date("2022-06-10"),
    },
    {
      name: "雷沃耕地机",
      type: MachineryType.PLOW,
      plateNumber: "农机004",
      brand: "雷沃",
      model: "M2004-Q",
      year: 2019,
      status: MachineryStatus.IDLE,
      fuelCapacity: 180,
      currentFuel: 80,
      efficiency: 7.8,
      purchaseDate: new Date("2019-08-01"),
    },
  ];

  for (const data of machineryData) {
    await prisma.machinery.upsert({
      where: { plateNumber: data.plateNumber },
      update: {},
      create: data,
    });
  }

  const driverData = [
    {
      name: "王司机",
      phone: "13900000001",
      licenseNo: "110101198001011234",
      village: "镇政府",
    },
    {
      name: "刘司机",
      phone: "13900000002",
      licenseNo: "110101198502022345",
      village: "东庄村",
    },
    {
      name: "陈司机",
      phone: "13900000003",
      licenseNo: "110101199003033456",
      village: "西坡村",
    },
  ];

  for (const data of driverData) {
    await prisma.driver.upsert({
      where: { licenseNo: data.licenseNo },
      update: {},
      create: data,
    });
  }

  const fieldData = [
    {
      village: "东庄村",
      location: "东庄北地1号",
      area: 50.5,
      cropType: "小麦",
      ownerName: "张农户",
      ownerPhone: "13800000002",
      description: "地势平坦，灌溉便利",
    },
    {
      village: "东庄村",
      location: "东庄南地2号",
      area: 35.0,
      cropType: "玉米",
      ownerName: "张农户",
      ownerPhone: "13800000002",
      description: "靠近公路，运输方便",
    },
    {
      village: "西坡村",
      location: "西坡东地1号",
      area: 45.0,
      cropType: "小麦",
      ownerName: "李农户",
      ownerPhone: "13800000003",
      description: "土壤肥沃，适合种植",
    },
    {
      village: "西坡村",
      location: "西坡西地2号",
      area: 60.0,
      cropType: "水稻",
      ownerName: "李农户",
      ownerPhone: "13800000003",
      description: "水源充足，适合水稻",
    },
  ];

  for (const data of fieldData) {
    await prisma.field.upsert({
      where: { id: 0 },
      update: {},
      create: data,
    });
  }

  console.log("数据播种完成！");
  console.log("测试账号：");
  console.log("  管理员：admin / 123456");
  console.log("  农户1：farmer1 / 123456");
  console.log("  农户2：farmer2 / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
