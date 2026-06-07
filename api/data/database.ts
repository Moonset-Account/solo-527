import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'aesthetics.db');

const CONSULTANTS = [
  { id: 'c1', name: '张薇', team: 'A组' },
  { id: 'c2', name: '李明', team: 'A组' },
  { id: 'c3', name: '王芳', team: 'B组' },
  { id: 'c4', name: '赵强', team: 'B组' },
  { id: 'c5', name: '陈静', team: 'C组' },
  { id: 'c6', name: '刘洋', team: 'C组' },
  { id: 'c7', name: '黄丽', team: 'A组' },
  { id: 'c8', name: '周伟', team: 'B组' },
];

const CHANNELS = [
  { id: 'ch1', name: '小红书', type: 'social' },
  { id: 'ch2', name: '抖音', type: 'social' },
  { id: 'ch3', name: '美团', type: 'platform' },
  { id: 'ch4', name: '百度推广', type: 'search' },
  { id: 'ch5', name: '口碑转介', type: 'referral' },
  { id: 'ch6', name: '线下活动', type: 'offline' },
];

const PROJECTS = [
  { id: 'p1', name: '玻尿酸填充', category: '注射美容', isSensitive: false },
  { id: 'p2', name: '肉毒素瘦脸', category: '注射美容', isSensitive: false },
  { id: 'p3', name: '激光嫩肤', category: '光电美肤', isSensitive: false },
  { id: 'p4', name: '热玛吉抗衰', category: '光电美肤', isSensitive: false },
  { id: 'p5', name: '私密紧致', category: '私密养护', isSensitive: true },
  { id: 'p6', name: '私密漂红', category: '私密养护', isSensitive: true },
  { id: 'p7', name: '双眼皮成形', category: '眼部整形', isSensitive: false },
  { id: 'p8', name: '鼻综合', category: '鼻部整形', isSensitive: false },
  { id: 'p9', name: '线雕提升', category: '抗衰紧致', isSensitive: false },
  { id: 'p10', name: '水光针', category: '注射美容', isSensitive: false },
];

const STAGES = ['lead', 'consulted', 'appointed', 'visited', 'planned', 'paid', 'followed_up'];

const SEED = 42;

let _seed = SEED;

function resetSeed(): void {
  _seed = SEED;
}

function seededRandom(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}

function seededInt(min: number, max: number): number {
  return Math.floor(seededRandom() * (max - min + 1)) + min;
}

function seededPick<T>(arr: T[]): T {
  return arr[Math.floor(seededRandom() * arr.length)];
}

function seededDate(start: Date, end: Date): string {
  const time = start.getTime() + seededRandom() * (end.getTime() - start.getTime());
  return new Date(time).toISOString();
}

const TABLE_NAMES = [
  'consultants', 'channels', 'projects', 'customers',
  'consultations', 'appointments', 'visits',
  'treatment_plans', 'payments', 'follow_ups',
];

function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS consultants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      team TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      is_sensitive INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      masked_phone TEXT NOT NULL,
      stage TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      consultant_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (consultant_id) REFERENCES consultants(id),
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      consultation_id TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      confirmed_at TEXT,
      status TEXT NOT NULL,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      arrived_at TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS treatment_plans (
      id TEXT PRIMARY KEY,
      visit_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      category TEXT NOT NULL,
      is_sensitive INTEGER NOT NULL,
      estimated_amount REAL NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (visit_id) REFERENCES visits(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT NOT NULL,
      paid_at TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES treatment_plans(id)
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      next_visit_at TEXT,
      actual_visit_at TEXT,
      interval_days INTEGER,
      status TEXT NOT NULL,
      FOREIGN KEY (payment_id) REFERENCES payments(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);
}

function createIndexes(db: Database.Database): void {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_consultations_consultant_id ON consultations(consultant_id);
    CREATE INDEX IF NOT EXISTS idx_consultations_channel_id ON consultations(channel_id);
    CREATE INDEX IF NOT EXISTS idx_consultations_project_id ON consultations(project_id);
    CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at);
    CREATE INDEX IF NOT EXISTS idx_customers_stage ON customers(stage);
    CREATE INDEX IF NOT EXISTS idx_follow_ups_project_id ON follow_ups(project_id);
    CREATE INDEX IF NOT EXISTS idx_follow_ups_interval_days ON follow_ups(interval_days);
  `);
}

interface SeedCustomers {
  id: string;
  maskedPhone: string;
  stage: string;
}

interface SeedConsultations {
  id: string;
  customerId: string;
  consultantId: string;
  channelId: string;
  projectId: string;
  createdAt: string;
  status: string;
}

interface SeedAppointments {
  id: string;
  consultationId: string;
  scheduledAt: string;
  confirmedAt: string | null;
  status: string;
}

interface SeedVisits {
  id: string;
  appointmentId: string;
  arrivedAt: string;
  status: string;
}

interface SeedTreatmentPlans {
  id: string;
  visitId: string;
  projectId: string;
  category: string;
  isSensitive: boolean;
  estimatedAmount: number;
  status: string;
}

interface SeedPayments {
  id: string;
  planId: string;
  amount: number;
  method: string;
  paidAt: string;
  status: string;
}

interface SeedFollowUps {
  id: string;
  paymentId: string;
  projectId: string;
  nextVisitAt: string | null;
  actualVisitAt: string | null;
  intervalDays: number | null;
  status: string;
}

function generateCustomers(count: number): SeedCustomers[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cust${i + 1}`,
    maskedPhone: `138****${String(seededInt(1000, 9999))}`,
    stage: seededPick(STAGES),
  }));
}

function generateConsultations(customers: SeedCustomers[]): SeedConsultations[] {
  const result: SeedConsultations[] = [];
  const start = new Date('2024-07-01');
  const end = new Date('2025-06-30');

  for (const customer of customers) {
    const numConsultations = seededInt(1, 3);
    for (let j = 0; j < numConsultations; j++) {
      result.push({
        id: `con${result.length + 1}`,
        customerId: customer.id,
        consultantId: seededPick(CONSULTANTS).id,
        channelId: seededPick(CHANNELS).id,
        projectId: seededPick(PROJECTS).id,
        createdAt: seededDate(start, end),
        status: seededPick(['active', 'active', 'active', 'closed']),
      });
    }
  }
  return result;
}

function generateAppointments(consultations: SeedConsultations[]): SeedAppointments[] {
  return consultations
    .filter(() => seededRandom() < 0.72)
    .map((con, i) => {
      const scheduledAt = new Date(con.createdAt);
      scheduledAt.setDate(scheduledAt.getDate() + seededInt(1, 7));
      return {
        id: `apt${i + 1}`,
        consultationId: con.id,
        scheduledAt: scheduledAt.toISOString(),
        confirmedAt: seededRandom() < 0.85 ? scheduledAt.toISOString() : null,
        status: seededPick(['confirmed', 'pending', 'cancelled']),
      };
    });
}

function generateVisits(appointments: SeedAppointments[]): SeedVisits[] {
  return appointments
    .filter((apt) => apt.confirmedAt && seededRandom() < 0.68)
    .map((apt, i) => {
      const arrivedAt = new Date(apt.scheduledAt);
      arrivedAt.setMinutes(arrivedAt.getMinutes() + seededInt(-15, 30));
      return {
        id: `vis${i + 1}`,
        appointmentId: apt.id,
        arrivedAt: arrivedAt.toISOString(),
        status: 'completed',
      };
    });
}

function generateTreatmentPlans(visits: SeedVisits[]): SeedTreatmentPlans[] {
  return visits
    .filter(() => seededRandom() < 0.6)
    .map((vis, i) => {
      const project = seededPick(PROJECTS);
      return {
        id: `plan${i + 1}`,
        visitId: vis.id,
        projectId: project.id,
        category: project.category,
        isSensitive: project.isSensitive,
        estimatedAmount: seededInt(2000, 80000) * 100 / 100,
        status: seededPick(['proposed', 'accepted', 'rejected']),
      };
    });
}

function generatePayments(plans: SeedTreatmentPlans[]): SeedPayments[] {
  return plans
    .filter((p) => p.status === 'accepted' || seededRandom() < 0.55)
    .map((plan, i) => ({
      id: `pay${i + 1}`,
      planId: plan.id,
      amount: plan.estimatedAmount * seededInt(80, 100) / 100,
      method: seededPick(['微信', '支付宝', '银行卡', '分期']),
      paidAt: new Date().toISOString(),
      status: seededPick(['completed', 'completed', 'completed', 'pending']),
    }));
}

function generateFollowUps(payments: SeedPayments[]): SeedFollowUps[] {
  return payments
    .filter((p) => p.status === 'completed')
    .map((pay, i) => {
      const nextVisit = new Date(pay.paidAt);
      nextVisit.setDate(nextVisit.getDate() + seededInt(14, 90));
      const didVisit = seededRandom() < 0.4;
      const actualVisit = didVisit
        ? new Date(nextVisit.getTime() + seededInt(-3, 7) * 86400000)
        : null;
      return {
        id: `fu${i + 1}`,
        paymentId: pay.id,
        projectId: seededPick(PROJECTS).id,
        nextVisitAt: nextVisit.toISOString(),
        actualVisitAt: actualVisit?.toISOString() ?? null,
        intervalDays: actualVisit
          ? Math.round((actualVisit.getTime() - new Date(pay.paidAt).getTime()) / 86400000)
          : null,
        status: didVisit ? 'completed' : seededPick(['scheduled', 'overdue']),
      };
    });
}

export function seedData(db: Database.Database): void {
  resetSeed();

  const customers = generateCustomers(500);
  const consultations = generateConsultations(customers);
  const appointments = generateAppointments(consultations);
  const visits = generateVisits(appointments);
  const treatmentPlans = generateTreatmentPlans(visits);
  const payments = generatePayments(treatmentPlans);
  const followUps = generateFollowUps(payments);

  const insertConsultant = db.prepare(
    'INSERT INTO consultants (id, name, team) VALUES (?, ?, ?)'
  );
  const insertChannel = db.prepare(
    'INSERT INTO channels (id, name, type) VALUES (?, ?, ?)'
  );
  const insertProject = db.prepare(
    'INSERT INTO projects (id, name, category, is_sensitive) VALUES (?, ?, ?, ?)'
  );
  const insertCustomer = db.prepare(
    'INSERT INTO customers (id, masked_phone, stage) VALUES (?, ?, ?)'
  );
  const insertConsultation = db.prepare(
    'INSERT INTO consultations (id, customer_id, consultant_id, channel_id, project_id, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertAppointment = db.prepare(
    'INSERT INTO appointments (id, consultation_id, scheduled_at, confirmed_at, status) VALUES (?, ?, ?, ?, ?)'
  );
  const insertVisit = db.prepare(
    'INSERT INTO visits (id, appointment_id, arrived_at, status) VALUES (?, ?, ?, ?)'
  );
  const insertTreatmentPlan = db.prepare(
    'INSERT INTO treatment_plans (id, visit_id, project_id, category, is_sensitive, estimated_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertPayment = db.prepare(
    'INSERT INTO payments (id, plan_id, amount, method, paid_at, status) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertFollowUp = db.prepare(
    'INSERT INTO follow_ups (id, payment_id, project_id, next_visit_at, actual_visit_at, interval_days, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const transaction = db.transaction(() => {
    for (const c of CONSULTANTS) {
      insertConsultant.run(c.id, c.name, c.team);
    }
    for (const ch of CHANNELS) {
      insertChannel.run(ch.id, ch.name, ch.type);
    }
    for (const p of PROJECTS) {
      insertProject.run(p.id, p.name, p.category, p.isSensitive ? 1 : 0);
    }
    for (const cust of customers) {
      insertCustomer.run(cust.id, cust.maskedPhone, cust.stage);
    }
    for (const con of consultations) {
      insertConsultation.run(con.id, con.customerId, con.consultantId, con.channelId, con.projectId, con.createdAt, con.status);
    }
    for (const apt of appointments) {
      insertAppointment.run(apt.id, apt.consultationId, apt.scheduledAt, apt.confirmedAt, apt.status);
    }
    for (const vis of visits) {
      insertVisit.run(vis.id, vis.appointmentId, vis.arrivedAt, vis.status);
    }
    for (const plan of treatmentPlans) {
      insertTreatmentPlan.run(plan.id, plan.visitId, plan.projectId, plan.category, plan.isSensitive ? 1 : 0, plan.estimatedAmount, plan.status);
    }
    for (const pay of payments) {
      insertPayment.run(pay.id, pay.planId, pay.amount, pay.method, pay.paidAt, pay.status);
    }
    for (const fu of followUps) {
      insertFollowUp.run(fu.id, fu.paymentId, fu.projectId, fu.nextVisitAt, fu.actualVisitAt, fu.intervalDays, fu.status);
    }
  });

  transaction();
}

export interface CleanResult {
  duplicatesRemoved: number;
  anomaliesFound: number;
}

export function cleanData(db: Database.Database): CleanResult {
  let duplicatesRemoved = 0;

  const findDuplicates = db.prepare(`
    SELECT customer_id, project_id, DATE(created_at) as date_key, MIN(id) as keep_id
    FROM consultations
    GROUP BY customer_id, project_id, DATE(created_at)
    HAVING COUNT(*) > 1
  `);

  const deleteConsultation = db.prepare('DELETE FROM consultations WHERE id = ?');

  const dedupTransaction = db.transaction(() => {
    const duplicates = findDuplicates.all() as Array<{ customer_id: string; project_id: string; date_key: string; keep_id: string }>;
    for (const dup of duplicates) {
      const getToRemove = db.prepare(
        'SELECT id FROM consultations WHERE customer_id = ? AND project_id = ? AND DATE(created_at) = ? AND id != ?'
      );
      const toRemove = getToRemove.all(dup.customer_id, dup.project_id, dup.date_key, dup.keep_id) as Array<{ id: string }>;
      for (const row of toRemove) {
        deleteConsultation.run(row.id);
        duplicatesRemoved++;
      }
    }
  });

  dedupTransaction();

  let anomaliesFound = 0;

  const orphanAppointments = db.prepare(`
    SELECT COUNT(*) as cnt FROM appointments WHERE consultation_id NOT IN (SELECT id FROM consultations)
  `).get() as { cnt: number };
  anomaliesFound += orphanAppointments.cnt;

  const orphanVisits = db.prepare(`
    SELECT COUNT(*) as cnt FROM visits WHERE appointment_id NOT IN (SELECT id FROM appointments)
  `).get() as { cnt: number };
  anomaliesFound += orphanVisits.cnt;

  const orphanPlans = db.prepare(`
    SELECT COUNT(*) as cnt FROM treatment_plans WHERE visit_id NOT IN (SELECT id FROM visits)
  `).get() as { cnt: number };
  anomaliesFound += orphanPlans.cnt;

  const orphanPayments = db.prepare(`
    SELECT COUNT(*) as cnt FROM payments WHERE plan_id NOT IN (SELECT id FROM treatment_plans)
  `).get() as { cnt: number };
  anomaliesFound += orphanPayments.cnt;

  const orphanFollowUps = db.prepare(`
    SELECT COUNT(*) as cnt FROM follow_ups WHERE payment_id NOT IN (SELECT id FROM payments)
  `).get() as { cnt: number };
  anomaliesFound += orphanFollowUps.cnt;

  return { duplicatesRemoved, anomaliesFound };
}

let dbInstance: Database.Database | null = null;

function needsMigration(db: Database.Database): boolean {
  for (const name of TABLE_NAMES) {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(name);
    if (!row) return true;
  }
  return false;
}

export function getDB(): Database.Database {
  if (dbInstance) return dbInstance;

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  if (needsMigration(db)) {
    createTables(db);
    createIndexes(db);
    seedData(db);
  }

  dbInstance = db;
  return db;
}

export function resetDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }

  const db = new Database(DB_PATH);
  db.pragma('foreign_keys = OFF');

  for (const name of TABLE_NAMES) {
    db.exec(`DROP TABLE IF EXISTS ${name}`);
  }

  db.pragma('foreign_keys = ON');
  createTables(db);
  createIndexes(db);
  seedData(db);

  dbInstance = db;
}

export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
