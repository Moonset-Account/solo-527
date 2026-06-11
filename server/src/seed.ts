import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Company } from './common/company.entity.js';
import { User } from './common/user.entity.js';
import { Customer } from './common/customer.entity.js';
import { Project } from './project/project.entity.js';
import { Budget } from './budget/budget.entity.js';
import { BudgetItem } from './budget/budget-item.entity.js';
import { MaterialItem } from './budget/material-item.entity.js';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'renovation_budget',
    entities: [Company, User, Customer, Project, Budget, BudgetItem, MaterialItem],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const companyRepo = dataSource.getRepository(Company);
  const userRepo = dataSource.getRepository(User);
  const customerRepo = dataSource.getRepository(Customer);
  const projectRepo = dataSource.getRepository(Project);
  const budgetRepo = dataSource.getRepository(Budget);
  const budgetItemRepo = dataSource.getRepository(BudgetItem);
  const materialItemRepo = dataSource.getRepository(MaterialItem);

  const company = companyRepo.create({
    name: '精装之家装饰公司',
    phone: '021-12345678',
    address: '上海市浦东新区张江高科技园区',
  });
  await companyRepo.save(company);
  console.log('Company created:', company.id);

  const owner = userRepo.create({
    companyId: company.id,
    name: '张总',
    email: 'owner@example.com',
    password: '123456',
    role: 'owner',
  });
  await userRepo.save(owner);
  console.log('Owner user created:', owner.id);

  const worker = userRepo.create({
    companyId: company.id,
    name: '李工',
    email: 'worker@example.com',
    password: '123456',
    role: 'worker',
  });
  await userRepo.save(worker);
  console.log('Worker user created:', worker.id);

  const customer1 = customerRepo.create({
    companyId: company.id,
    name: '王先生',
    email: 'wang@example.com',
    password: '123456',
    phone: '13800000001',
    address: '上海市徐汇区衡山路88号',
    accessToken: 'portal-wang-2024',
  });
  await customerRepo.save(customer1);
  console.log('Customer 1 created:', customer1.id);

  const customer2 = customerRepo.create({
    companyId: company.id,
    name: '赵女士',
    email: 'zhao@example.com',
    password: '123456',
    phone: '13800000002',
    address: '上海市长宁区中山公园旁',
    accessToken: 'portal-zhao-2024',
  });
  await customerRepo.save(customer2);
  console.log('Customer 2 created:', customer2.id);

  const project1 = projectRepo.create({
    companyId: company.id,
    customerId: customer1.id,
    name: '衡山路88号全屋翻新',
    description: '三室两厅全屋精装修，含水电改造',
    address: '上海市徐汇区衡山路88号12D',
    status: 'in_progress',
    budget: 250000,
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-06-30'),
  });
  await projectRepo.save(project1);
  console.log('Project 1 created:', project1.id);

  const project2 = projectRepo.create({
    companyId: company.id,
    customerId: customer2.id,
    name: '中山公园住宅局部改造',
    description: '厨房和卫生间翻新改造',
    address: '上海市长宁区中山公园旁5栋3单元',
    status: 'planning',
    budget: 80000,
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-07-31'),
  });
  await projectRepo.save(project2);
  console.log('Project 2 created:', project2.id);

  const budget1 = budgetRepo.create({
    projectId: project1.id,
    version: 1,
    name: '全屋翻新预算V1',
    subtotal: 220000,
    managementFee: 15000,
    designFee: 8000,
    taxAmount: 14580,
    totalAmount: 257580,
    status: 'approved',
    createdBy: owner.id,
  });
  await budgetRepo.save(budget1);
  console.log('Budget 1 created:', budget1.id);

  const item1 = budgetItemRepo.create({
    budgetId: budget1.id,
    name: '客厅地砖铺设',
    category: '泥工',
    quantity: 45,
    unit: '㎡',
    unitPrice: 180,
    laborCost: 3000,
    totalPrice: 11100,
    sort: 0,
  });
  await budgetItemRepo.save(item1);

  const mat1 = materialItemRepo.create({
    budgetItemId: item1.id,
    name: '马可波罗地砖 800x800',
    brand: '马可波罗',
    specification: '800x800mm 抛釉砖',
    quantity: 45,
    unit: '㎡',
    unitPrice: 160,
    totalPrice: 7200,
  });
  await materialItemRepo.save(mat1);

  const item2 = budgetItemRepo.create({
    budgetId: budget1.id,
    name: '主卧木地板',
    category: '地板',
    quantity: 20,
    unit: '㎡',
    unitPrice: 280,
    laborCost: 1500,
    totalPrice: 7100,
    sort: 1,
  });
  await budgetItemRepo.save(item2);

  const mat2 = materialItemRepo.create({
    budgetItemId: item2.id,
    name: '圣象实木复合地板',
    brand: '圣象',
    specification: '多层实木复合 橡木色',
    quantity: 20,
    unit: '㎡',
    unitPrice: 260,
    totalPrice: 5200,
  });
  await materialItemRepo.save(mat2);

  const budget2 = budgetRepo.create({
    projectId: project1.id,
    version: 2,
    name: '全屋翻新预算V2（调整）',
    subtotal: 235000,
    managementFee: 16000,
    designFee: 8000,
    taxAmount: 15540,
    totalAmount: 274540,
    status: 'pending_review',
    createdBy: worker.id,
  });
  await budgetRepo.save(budget2);
  console.log('Budget 2 created:', budget2.id);

  const budget3 = budgetRepo.create({
    projectId: project2.id,
    version: 1,
    name: '厨卫改造预算V1',
    subtotal: 65000,
    managementFee: 5000,
    designFee: 3000,
    taxAmount: 4380,
    totalAmount: 77380,
    status: 'draft',
    createdBy: worker.id,
  });
  await budgetRepo.save(budget3);
  console.log('Budget 3 created:', budget3.id);

  const item3 = budgetItemRepo.create({
    budgetId: budget3.id,
    name: '厨房墙地砖',
    category: '泥工',
    quantity: 30,
    unit: '㎡',
    unitPrice: 150,
    laborCost: 2000,
    totalPrice: 6500,
    sort: 0,
  });
  await budgetItemRepo.save(item3);

  await dataSource.destroy();
  console.log('\nSeed completed successfully!');
  console.log('Owner login: owner@example.com / 123456');
  console.log('Worker login: worker@example.com / 123456');
  console.log('Customer login: wang@example.com / 123456');
  console.log('Portal access: /auth/portal/portal-wang-2024');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
