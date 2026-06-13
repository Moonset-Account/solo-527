import 'dotenv/config';
import { DataSource } from 'typeorm';
import { Company } from './common/company.entity.js';
import { User } from './common/user.entity.js';
import { Customer } from './common/customer.entity.js';
import { Project } from './project/project.entity.js';
import { Budget } from './budget/budget.entity.js';
import { BudgetItem } from './budget/budget-item.entity.js';
import { MaterialItem } from './budget/material-item.entity.js';
import { AfterSaleOrder } from './after-sale/after-sale.entity.js';
import { Feedback } from './feedback/feedback.entity.js';
import { Contract } from './contract/contract.entity.js';
import { ProjectPhoto } from './file/project-photo.entity.js';
import { Attachment } from './file/attachment.entity.js';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'renovation_budget',
    entities: [
      Company, User, Customer, Project, Budget, BudgetItem, MaterialItem,
      AfterSaleOrder, Feedback, Contract, ProjectPhoto, Attachment
    ],
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
  const afterSaleRepo = dataSource.getRepository(AfterSaleOrder);
  const feedbackRepo = dataSource.getRepository(Feedback);
  const contractRepo = dataSource.getRepository(Contract);
  const photoRepo = dataSource.getRepository(ProjectPhoto);
  const attachmentRepo = dataSource.getRepository(Attachment);

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
    area: 120.5,
    style: '现代简约',
    status: 'constructing',
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
    area: 68.0,
    style: '北欧风格',
    status: 'budgeting',
    budget: 80000,
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-07-31'),
  });
  await projectRepo.save(project2);
  console.log('Project 2 created:', project2.id);

  const budget1 = budgetRepo.create({
    projectId: project1.id,
    version: 1,
    laborCost: 80000,
    materialCost: 145000,
    totalCost: 225000,
    status: 'approved',
    createdBy: owner.id,
    reviewedBy: owner.id,
    changeReason: '初始版本',
  });
  await budgetRepo.save(budget1);
  console.log('Budget 1 created:', budget1.id);

  const item1 = budgetItemRepo.create({
    budgetId: budget1.id,
    name: '客厅地砖铺设',
    category: 'masonry',
    description: '800x800mm地砖铺设，含人工辅料',
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
    category: 'carpentry',
    description: '多层实木复合地板安装',
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
    laborCost: 85000,
    materialCost: 155000,
    totalCost: 240000,
    status: 'pending_review',
    createdBy: worker.id,
    changeReason: '客户要求更换地砖品牌，增加衣帽间设计',
  });
  await budgetRepo.save(budget2);
  console.log('Budget 2 created:', budget2.id);

  const budget3 = budgetRepo.create({
    projectId: project2.id,
    version: 1,
    laborCost: 25000,
    materialCost: 45000,
    totalCost: 70000,
    status: 'draft',
    createdBy: worker.id,
    changeReason: '初始草案',
  });
  await budgetRepo.save(budget3);
  console.log('Budget 3 created:', budget3.id);

  const item3 = budgetItemRepo.create({
    budgetId: budget3.id,
    name: '厨房墙地砖',
    category: 'masonry',
    description: '厨房墙面300x600，地面300x300防滑砖',
    quantity: 30,
    unit: '㎡',
    unitPrice: 150,
    laborCost: 2000,
    totalPrice: 6500,
    sort: 0,
  });
  await budgetItemRepo.save(item3);

  const photo1 = photoRepo.create({
    projectId: project1.id,
    area: '客厅',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=200',
    uploadedBy: worker.id,
  });
  await photoRepo.save(photo1);
  console.log('Photo 1 created:', photo1.id);

  const photo2 = photoRepo.create({
    projectId: project1.id,
    area: '主卧',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200',
    uploadedBy: worker.id,
  });
  await photoRepo.save(photo2);

  const attachment1 = attachmentRepo.create({
    entityType: 'project',
    entityId: project1.id,
    fileName: '施工方案.pdf',
    fileSize: 2500000,
    fileType: 'application/pdf',
    url: '/uploads/1/施工方案.pdf',
    uploadedBy: worker.id,
  });
  await attachmentRepo.save(attachment1);
  console.log('Attachment 1 created:', attachment1.id);

  const contract1 = contractRepo.create({
    projectId: project1.id,
    budgetId: budget1.id,
    content: '合同内容：衡山路88号全屋翻新\n...',
    status: 'draft',
  });
  await contractRepo.save(contract1);
  console.log('Contract 1 created:', contract1.id);

  const feedback1 = feedbackRepo.create({
    projectId: project1.id,
    customerId: customer1.id,
    stage: 'design',
    rating: 5,
    comment: '设计方案很满意，效率很高！',
  });
  await feedbackRepo.save(feedback1);
  console.log('Feedback 1 created:', feedback1.id);

  const afterSale1 = afterSaleRepo.create({
    projectId: project1.id,
    title: '墙面局部开裂修补',
    description: '客厅背景墙有局部小裂缝，需要修补',
    status: 'pending',
    assigneeId: worker.id,
  });
  await afterSaleRepo.save(afterSale1);
  console.log('After-sale 1 created:', afterSale1.id);

  const afterSale2 = afterSaleRepo.create({
    projectId: project1.id,
    title: '门锁调试',
    description: '主卧室门锁开合不顺畅',
    status: 'processing',
    assigneeId: worker.id,
  });
  await afterSaleRepo.save(afterSale2);

  const afterSale3 = afterSaleRepo.create({
    projectId: project2.id,
    title: '防水测试',
    description: '卫生间闭水测试',
    status: 'closed',
    assigneeId: worker.id,
    resolvedAt: new Date('2024-05-15'),
    closedAt: new Date('2024-05-16'),
  });
  await afterSaleRepo.save(afterSale3);

  await dataSource.destroy();
  console.log('\nSeed completed successfully!');
  console.log('Owner login: owner@example.com / 123456');
  console.log('Worker login: worker@example.com / 123456');
  console.log('Customer portal access: /portal/portal-wang-2024');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
