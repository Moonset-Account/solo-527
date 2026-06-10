import bcrypt from 'bcryptjs';
import { db } from './index';
import { users, apartments, customers } from './schema';

async function seed() {
  console.log('开始种子数据...');

  const hashedPassword = await bcrypt.hash('123456', 10);

  await db.insert(users).values([
    { username: 'admin', password: hashedPassword, name: '系统管理员', role: 'admin', phone: '13800000000' },
    { username: 'consultant1', password: hashedPassword, name: '张顾问', role: 'consultant', phone: '13800000001' },
    { username: 'consultant2', password: hashedPassword, name: '李顾问', role: 'consultant', phone: '13800000002' },
  ]);

  const apartmentData = [];
  for (let i = 1; i <= 30; i++) {
    const building = String.fromCharCode(65 + Math.floor(Math.random() * 3));
    const floor = Math.floor(Math.random() * 20) + 1;
    const roomNo = String(i).padStart(3, '0');
    const layouts = ['一室一厅', '两室一厅', '三室一厅', '两室两厅', '三室两厅'];
    const statuses = ['vacant', 'occupied', 'reserved', 'maintenance'];
    
    apartmentData.push({
      apartmentNo: `${building}${floor}${roomNo}`,
      building: `${building}栋`,
      floor,
      area: Math.round((40 + Math.random() * 80) * 100) / 100,
      layout: layouts[Math.floor(Math.random() * layouts.length)],
      orientation: ['南', '北', '东', '西', '东南', '西南'][Math.floor(Math.random() * 6)],
      decoration: ['精装', '简装', '毛坯'][Math.floor(Math.random() * 3)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      monthlyRent: Math.round((2000 + Math.random() * 6000) * 100) / 100,
      depositMonths: Math.floor(Math.random() * 2) + 1,
      description: `位于${building}栋${floor}层，采光良好，交通便利。`,
      facilities: { hasAirConditioner: Math.random() > 0.3, hasWashingMachine: Math.random() > 0.5, hasRefrigerator: Math.random() > 0.4, hasTV: Math.random() > 0.6 },
    });
  }
  await db.insert(apartments).values(apartmentData);

  const customerData = [];
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '陈一', '刘二'];
  for (let i = 0; i < 20; i++) {
    customerData.push({
      name: names[i % names.length] + (Math.floor(i / 10) || ''),
      phone: `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      idCard: `110101${1990 + Math.floor(Math.random() * 20)}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      source: ['线上', '转介绍', '门店', '其他'][Math.floor(Math.random() * 4)],
      requirements: ['希望安静', '需要停车位', '近地铁', '可养宠物', '儿童友好'][Math.floor(Math.random() * 5)],
      consultantId: Math.random() > 0.5 ? 2 : 3,
    });
  }
  await db.insert(customers).values(customerData);

  console.log('种子数据完成！');
  console.log('默认账号: admin / 123456 (管理员)');
  console.log('默认账号: consultant1 / 123456 (顾问)');
}

seed().catch(console.error);
