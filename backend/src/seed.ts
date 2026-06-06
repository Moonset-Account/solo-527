import 'reflect-metadata';
import { AppDataSource } from './data-source';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const userRepository = AppDataSource.getRepository('User');
  const supplierRepository = AppDataSource.getRepository('Supplier');
  const demandRepository = AppDataSource.getRepository('Demand');

  const existingUsers = await userRepository.count();
  if (existingUsers === 0) {
    const passwordHash = await bcrypt.hash('123456', 10);

    const users = [
      { username: 'admin', name: '系统管理员', role: 'admin', email: 'admin@travel.com', phone: '13800000000', passwordHash },
      { username: 'manager', name: '张主管', role: 'manager', email: 'manager@travel.com', phone: '13800000001', passwordHash },
      { username: 'product1', name: '李产品', role: 'product', email: 'product1@travel.com', phone: '13800000002', passwordHash },
      { username: 'product2', name: '陈产品', role: 'product', email: 'product2@travel.com', phone: '13800000007', passwordHash },
      { username: 'sales1', name: '王销售', role: 'sales', email: 'sales1@travel.com', phone: '13800000003', passwordHash },
      { username: 'sales2', name: '刘销售', role: 'sales', email: 'sales2@travel.com', phone: '13800000008', passwordHash },
      { username: 'finance1', name: '赵财务', role: 'finance', email: 'finance1@travel.com', phone: '13800000004', passwordHash },
    ];

    await userRepository.save(users);
    console.log('Users seeded');
  }

  const existingSuppliers = await supplierRepository.count();
  if (existingSuppliers === 0) {
    const suppliers = [
      { type: 'hotel', name: '香格里拉大酒店', contactPerson: '张经理', contactPhone: '13900000001', address: '北京市朝阳区', rating: 4.8, status: 'active' },
      { type: 'hotel', name: '希尔顿酒店', contactPerson: '李经理', contactPhone: '13900000002', address: '上海市浦东新区', rating: 4.6, status: 'active' },
      { type: 'hotel', name: '万豪酒店', contactPerson: '王经理', contactPhone: '13900000003', address: '广州市天河区', rating: 4.7, status: 'active' },
      { type: 'vehicle', name: '顺达车队', contactPerson: '刘队长', contactPhone: '13900000004', address: '成都市武侯区', rating: 4.5, status: 'active' },
      { type: 'vehicle', name: '安捷租车', contactPerson: '陈经理', contactPhone: '13900000005', address: '杭州市西湖区', rating: 4.4, status: 'active' },
      { type: 'ticket', name: '景区票务中心', contactPerson: '周经理', contactPhone: '13900000006', address: '九寨沟景区', rating: 4.9, status: 'active' },
      { type: 'ticket', name: '欢乐谷票务', contactPerson: '吴经理', contactPhone: '13900000007', address: '深圳市南山区', rating: 4.3, status: 'active' },
      { type: 'guide', name: '金牌导游工作室', contactPerson: '郑导', contactPhone: '13900000008', address: '西安市雁塔区', rating: 4.8, status: 'active' },
    ];

    await supplierRepository.save(suppliers);
    console.log('Suppliers seeded');
  }

  console.log('Seeding completed');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
