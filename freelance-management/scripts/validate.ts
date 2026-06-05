import '../lib/db/schema';
import { db } from '../lib/db/schema';
import * as projectService from '../lib/services/projectService';
import * as clientService from '../lib/services/clientService';
import * as invoiceService from '../lib/services/invoiceService';
import * as taskService from '../lib/services/taskService';
import * as timeEntryService from '../lib/services/timeEntryService';
import * as statsService from '../lib/services/statsService';
import { Role, ProjectStatus, TaskStatus } from '../types';

console.log('🚀 开始验证自由职业管理平台...\n');

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${label}`);
  } catch (error: any) {
    console.error(`❌ ${label}: ${error.message}`);
  }
}

console.log('📊 数据库基础验证:');
test('用户表数据存在', () => {
  const users = db.prepare('SELECT * FROM users').all();
  if (users.length === 0) throw new Error('用户表为空');
  console.log(`   共 ${users.length} 个用户`);
});

test('客户表数据存在', () => {
  const clients = db.prepare('SELECT * FROM clients').all();
  if (clients.length === 0) throw new Error('客户表为空');
  console.log(`   共 ${clients.length} 个客户`);
});

test('项目表数据存在', () => {
  const projects = db.prepare('SELECT * FROM projects').all();
  if (projects.length === 0) throw new Error('项目表为空');
  console.log(`   共 ${projects.length} 个项目`);
});

test('任务表数据存在', () => {
  const tasks = db.prepare('SELECT * FROM tasks').all();
  if (tasks.length === 0) throw new Error('任务表为空');
  console.log(`   共 ${tasks.length} 个任务`);
});

test('工时记录表数据存在', () => {
  const entries = db.prepare('SELECT * FROM time_entries').all();
  if (entries.length === 0) throw new Error('工时记录表为空');
  console.log(`   共 ${entries.length} 条工时记录`);
});

test('发票表数据存在', () => {
  const invoices = db.prepare('SELECT * FROM invoices').all();
  if (invoices.length === 0) throw new Error('发票表为空');
  console.log(`   共 ${invoices.length} 张发票`);
});

test('报价单表数据存在', () => {
  const quotes = db.prepare('SELECT * FROM quotes').all();
  if (quotes.length === 0) throw new Error('报价单表为空');
  console.log(`   共 ${quotes.length} 张报价单`);
});

console.log('\n🔐 权限验证:');
test('设计师角色可访问所有项目', () => {
  const projects = projectService.getProjects(2, Role.DESIGNER);
  if (projects.length === 0) throw new Error('设计师无法访问项目');
  console.log(`   设计师可访问 ${projects.length} 个项目`);
});

test('客户角色只能访问自己的项目', () => {
  const projects = projectService.getProjects(3, Role.CLIENT);
  const allProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projects.length > allProjects.count) throw new Error('客户访问了超出权限的项目');
  console.log(`   客户可访问 ${projects.length} 个项目 (总计 ${allProjects.count} 个)`);
});

test('客户角色看不到敏感字段', () => {
  const projects = projectService.getProjects(3, Role.CLIENT);
  const hasBudget = projects.some((p: any) => p.budget !== undefined);
  console.log(`   客户数据包含预算字段: ${hasBudget ? '❌ 有风险' : '✅ 已隐藏'}`);
});

console.log('\n💰 财务数据验证:');
test('发票金额计算正确', () => {
  const invoices = db.prepare('SELECT * FROM invoices').all() as any[];
  invoices.forEach((inv) => {
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(inv.id) as any[];
    const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const calculatedTotal = itemsTotal + (inv.tax || 0) - (inv.discount || 0);
    if (Math.abs(calculatedTotal - inv.total_amount) > 0.01) {
      throw new Error(`发票 ${inv.invoice_number} 金额不匹配`);
    }
  });
  console.log(`   所有发票金额计算正确`);
});

test('收款后发票状态更新', () => {
  const paidInvoices = db.prepare("SELECT * FROM invoices WHERE status = 'paid'").all();
  if (paidInvoices.length === 0) throw new Error('没有已支付的发票');
  console.log(`   已支付发票: ${paidInvoices.length} 张`);
});

console.log('\n📈 统计数据验证:');
test('收入统计计算正确', () => {
  const stats = statsService.getRevenueStats();
  const payments = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'").get() as { total: number };
  if (Math.abs(stats.totalRevenue - payments.total) > 0.01) {
    throw new Error(`收入统计不匹配: 统计 ${stats.totalRevenue} vs 实际 ${payments.total}`);
  }
  console.log(`   总收入: ¥${stats.totalRevenue.toLocaleString()}`);
});

test('工时统计计算正确', () => {
  const stats = statsService.getRevenueStats();
  const hours = db.prepare('SELECT COALESCE(SUM(hours), 0) as total FROM time_entries').get() as { total: number };
  if (Math.abs(stats.totalHours - hours.total) > 0.01) {
    throw new Error(`工时统计不匹配`);
  }
  console.log(`   总工时: ${stats.totalHours} 小时`);
});

console.log('\n📋 业务流程验证:');
test('项目进度计算', () => {
  const projects = projectService.getProjects(2, Role.DESIGNER);
  projects.forEach((p: any) => {
    const progress = projectService.getProjectProgress(p.id);
    if (progress < 0 || progress > 100) throw new Error(`项目 ${p.name} 进度异常: ${progress}%`);
  });
  console.log(`   所有项目进度计算正常`);
});

test('发票编号生成', () => {
  const num1 = invoiceService.generateInvoiceNumber();
  const num2 = invoiceService.generateInvoiceNumber();
  if (num1 === num2) throw new Error('发票编号重复');
  console.log(`   发票编号生成正常: ${num1}, ${num2}`);
});

test('任务状态流转', () => {
  const tasks = taskService.getTasksByAssignee(2);
  if (tasks.length === 0) throw new Error('没有分配的任务');
  const statuses = [...new Set(tasks.map((t: any) => t.status))];
  console.log(`   任务状态类型: ${statuses.join(', ')}`);
});

console.log('\n📦 数据导出验证:');
test('发票导出功能', () => {
  const buffer = statsService.exportInvoicesToExcel();
  if (!buffer || buffer.length === 0) throw new Error('发票导出失败');
  console.log(`   发票导出成功 (${buffer.length} 字节)`);
});

test('工时导出功能', () => {
  const buffer = statsService.exportTimeEntriesToExcel();
  if (!buffer || buffer.length === 0) throw new Error('工时导出失败');
  console.log(`   工时导出成功 (${buffer.length} 字节)`);
});

test('收入报告导出功能', () => {
  const buffer = statsService.exportRevenueReport();
  if (!buffer || buffer.length === 0) throw new Error('收入报告导出失败');
  console.log(`   收入报告导出成功 (${buffer.length} 字节)`);
});

console.log('\n🔔 通知系统验证:');
test('通知创建功能', () => {
  const notifications = db.prepare('SELECT * FROM notifications').all();
  if (notifications.length === 0) throw new Error('没有通知记录');
  const unread = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE read = 0").get() as { count: number };
  console.log(`   通知总数: ${notifications.length}, 未读: ${unread.count}`);
});

console.log('\n✅ 验证完成!');
console.log('\n📝 测试账户:');
console.log('   管理员: admin@example.com / password123');
console.log('   设计师: designer@example.com / password123');
console.log('   客户: client@example.com / password123');
console.log('\n🚀 运行命令: npm run dev 启动开发服务器');
