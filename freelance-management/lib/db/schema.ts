import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'freelance.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'designer',
      avatar_url TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      company TEXT,
      address TEXT,
      user_id INTEGER REFERENCES users(id),
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      client_id INTEGER NOT NULL REFERENCES clients(id),
      status TEXT NOT NULL DEFAULT 'draft',
      start_date DATE,
      end_date DATE,
      budget REAL,
      hourly_rate REAL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      assignee_id INTEGER REFERENCES users(id),
      estimated_hours REAL,
      due_date DATE,
      order_index INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      hours REAL NOT NULL,
      description TEXT,
      entry_date DATE NOT NULL,
      billable INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      client_id INTEGER NOT NULL REFERENCES clients(id),
      quote_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      valid_until DATE,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id),
      client_id INTEGER NOT NULL REFERENCES clients(id),
      invoice_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      due_date DATE,
      sent_at DATETIME,
      paid_at DATETIME,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      amount REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_method TEXT,
      transaction_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      paid_at DATETIME,
      note TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      related_id INTEGER,
      related_type TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      uploaded_by INTEGER NOT NULL REFERENCES users(id),
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, user_id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    seedData();
  }
}

function seedData() {
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (email, name, password_hash, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  const adminId = insertUser.run('admin@example.com', '系统管理员', hashedPassword, 'admin', '13800000001').lastInsertRowid as number;
  const designerId = insertUser.run('designer@example.com', '张设计师', hashedPassword, 'designer', '13800000002').lastInsertRowid as number;
  const clientUserId = insertUser.run('client@example.com', '李客户', hashedPassword, 'client', '13800000003').lastInsertRowid as number;

  const insertClient = db.prepare(`
    INSERT INTO clients (name, email, phone, company, address, user_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const client1Id = insertClient.run('科技创新有限公司', 'contact@techcorp.com', '010-12345678', '科技创新有限公司', '北京市朝阳区xxx路xxx号', clientUserId, designerId).lastInsertRowid as number;
  const client2Id = insertClient.run('创意设计工作室', 'hello@creativestudio.com', '021-87654321', '创意设计工作室', '上海市浦东新区xxx路xxx号', null, designerId).lastInsertRowid as number;

  const insertProject = db.prepare(`
    INSERT INTO projects (name, description, client_id, status, start_date, end_date, budget, hourly_rate, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const project1Id = insertProject.run('品牌视觉设计项目', '为客户设计完整的品牌视觉识别系统，包括Logo、VI设计、品牌手册等', client1Id, 'in_progress', '2024-01-15', '2024-03-15', 50000, 300, designerId).lastInsertRowid as number;
  const project2Id = insertProject.run('官网UI设计', '企业官网的整体UI/UX设计，包含响应式设计和移动端适配', client1Id, 'pending_approval', '2024-02-01', '2024-04-01', 30000, 280, designerId).lastInsertRowid as number;
  const project3Id = insertProject.run('产品包装设计', '新产品系列的包装设计，包含3个SKU的设计方案', client2Id, 'delivered', '2023-12-01', '2024-01-31', 20000, 250, designerId).lastInsertRowid as number;

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(project1Id, designerId, 'owner');
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(project2Id, designerId, 'owner');
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(project3Id, designerId, 'owner');

  const insertTask = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, assignee_id, estimated_hours, due_date, order_index, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const task1 = insertTask.run(project1Id, 'Logo设计初稿', '设计3个不同方向的Logo初稿方案', 'in_progress', designerId, 8, '2024-01-25', 0, designerId).lastInsertRowid as number;
  const task2 = insertTask.run(project1Id, '品牌色彩系统', '制定品牌色彩规范', 'todo', designerId, 4, '2024-02-01', 1, designerId).lastInsertRowid as number;
  const task3 = insertTask.run(project1Id, 'VI基础系统设计', '名片、信纸、信封等基础VI设计', 'todo', designerId, 16, '2024-02-15', 2, designerId).lastInsertRowid as number;
  const task4 = insertTask.run(project1Id, '品牌手册设计', '完整的品牌手册排版设计', 'todo', designerId, 12, '2024-03-01', 3, designerId).lastInsertRowid as number;
  const task5 = insertTask.run(project2Id, '需求分析与原型', '分析客户需求，制作产品原型', 'done', designerId, 6, '2024-02-10', 0, designerId).lastInsertRowid as number;
  const task6 = insertTask.run(project2Id, '首页设计', '网站首页UI设计', 'review', designerId, 10, '2024-02-20', 1, designerId).lastInsertRowid as number;
  const task7 = insertTask.run(project3Id, '包装设计调研', '市场调研与竞品分析', 'done', designerId, 4, '2023-12-10', 0, designerId).lastInsertRowid as number;
  const task8 = insertTask.run(project3Id, '包装设计方案', '3个包装设计方案', 'done', designerId, 12, '2023-12-25', 1, designerId).lastInsertRowid as number;

  const insertTimeEntry = db.prepare(`
    INSERT INTO time_entries (task_id, user_id, project_id, hours, description, entry_date, billable)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertTimeEntry.run(task1, designerId, project1Id, 3, 'Logo草图构思', '2024-01-16', 1);
  insertTimeEntry.run(task1, designerId, project1Id, 4, 'Logo方案1设计', '2024-01-17', 1);
  insertTimeEntry.run(task1, designerId, project1Id, 2, 'Logo方案2设计', '2024-01-18', 1);
  insertTimeEntry.run(task2, designerId, project1Id, 2, '色彩研究', '2024-01-19', 1);
  insertTimeEntry.run(task5, designerId, project2Id, 6, '需求分析会议和原型制作', '2024-02-05', 1);
  insertTimeEntry.run(task6, designerId, project2Id, 8, '首页设计', '2024-02-12', 1);
  insertTimeEntry.run(task6, designerId, project2Id, 1, '设计修改', '2024-02-15', 1);
  insertTimeEntry.run(task7, designerId, project3Id, 4, '市场调研', '2023-12-05', 1);
  insertTimeEntry.run(task8, designerId, project3Id, 12, '包装设计方案制作', '2023-12-15', 1);

  const insertQuote = db.prepare(`
    INSERT INTO quotes (project_id, client_id, quote_number, title, description, amount, tax, discount, total_amount, status, valid_until, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const quote1Id = insertQuote.run(project1Id, client1Id, 'Q-2024-001', '品牌视觉设计报价', '包含Logo设计、VI系统、品牌手册等完整服务', 50000, 0, 0, 50000, 'accepted', '2024-02-15', designerId).lastInsertRowid as number;
  const quote2Id = insertQuote.run(project2Id, client1Id, 'Q-2024-002', '官网UI设计报价', '企业官网UI/UX设计服务', 30000, 0, 1000, 29000, 'sent', '2024-03-01', designerId).lastInsertRowid as number;
  const quote3Id = insertQuote.run(project3Id, client2Id, 'Q-2024-003', '产品包装设计报价', '产品系列包装设计', 20000, 0, 0, 20000, 'accepted', '2024-01-15', designerId).lastInsertRowid as number;

  const insertQuoteItem = db.prepare(`
    INSERT INTO quote_items (quote_id, description, quantity, unit_price, amount)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertQuoteItem.run(quote1Id, 'Logo设计（3套方案）', 1, 15000, 15000);
  insertQuoteItem.run(quote1Id, 'VI基础系统设计', 1, 20000, 20000);
  insertQuoteItem.run(quote1Id, '品牌手册设计', 1, 15000, 15000);
  insertQuoteItem.run(quote2Id, '需求分析与原型设计', 1, 8000, 8000);
  insertQuoteItem.run(quote2Id, 'UI界面设计', 1, 15000, 15000);
  insertQuoteItem.run(quote2Id, '响应式适配', 1, 7000, 7000);
  insertQuoteItem.run(quote3Id, '市场调研分析', 1, 3000, 3000);
  insertQuoteItem.run(quote3Id, '包装设计方案', 3, 5000, 15000);
  insertQuoteItem.run(quote3Id, '设计源文件交付', 1, 2000, 2000);

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (project_id, client_id, invoice_number, title, description, amount, tax, discount, total_amount, status, due_date, sent_at, paid_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const invoice1Id = insertInvoice.run(project1Id, client1Id, 'INV-2024-001', '品牌视觉设计首付款', '项目首付款50%', 25000, 0, 0, 25000, 'paid', '2024-02-01', '2024-01-20', '2024-01-25', designerId).lastInsertRowid as number;
  const invoice2Id = insertInvoice.run(project3Id, client2Id, 'INV-2024-002', '产品包装设计全款', '包装设计项目全款', 20000, 0, 0, 20000, 'paid', '2024-01-20', '2024-01-10', '2024-01-18', designerId).lastInsertRowid as number;
  const invoice3Id = insertInvoice.run(project1Id, client1Id, 'INV-2024-003', '品牌视觉设计尾款', '项目尾款50%', 25000, 0, 0, 25000, 'sent', '2024-03-20', '2024-03-05', null, designerId).lastInsertRowid as number;

  const insertInvoiceItem = db.prepare(`
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertInvoiceItem.run(invoice1Id, '品牌视觉设计首付款50%', 1, 25000, 25000);
  insertInvoiceItem.run(invoice2Id, '产品包装设计全款', 1, 20000, 20000);
  insertInvoiceItem.run(invoice3Id, '品牌视觉设计尾款50%', 1, 25000, 25000);

  const insertPayment = db.prepare(`
    INSERT INTO payments (invoice_id, amount, payment_method, transaction_id, status, paid_at, note, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPayment.run(invoice1Id, 25000, 'bank_transfer', 'TRX-001', 'paid', '2024-01-25', '银行转账', designerId);
  insertPayment.run(invoice2Id, 20000, 'alipay', 'ALI-001', 'paid', '2024-01-18', '支付宝付款', designerId);

  const insertNotification = db.prepare(`
    INSERT INTO notifications (user_id, type, title, content, related_id, related_type, read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotification.run(designerId, 'invoice_created', '新发票已创建', '发票 INV-2024-003 已创建并发送给客户', invoice3Id, 'invoice', 0);
  insertNotification.run(clientUserId, 'invoice_created', '收到新发票', '您有新的发票 INV-2024-003 待支付', invoice3Id, 'invoice', 0);
  insertNotification.run(designerId, 'payment_received', '付款已收到', '发票 INV-2024-001 已收到付款 ¥25,000', invoice1Id, 'payment', 1);

  const insertComment = db.prepare(`
    INSERT INTO comments (project_id, task_id, user_id, content)
    VALUES (?, ?, ?, ?)
  `);

  insertComment.run(project1Id, task1, designerId, '已完成Logo方案1和方案2的初步设计，明天继续方案3');
  insertComment.run(project1Id, null, clientUserId, '期待看到Logo设计方案，我们对设计很期待');

  console.log('Database seeded successfully');
}

initDatabase();
