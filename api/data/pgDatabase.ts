import pg from 'pg';

const { Pool } = pg;

const CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aesthetics';

let poolInstance: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    poolInstance = new Pool({ connectionString: CONNECTION_STRING });
  }
  return poolInstance;
}

export async function initializeSchema(): Promise<void> {
  const pool = getPool();

  await pool.query(`DROP TABLE IF EXISTS follow_ups CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS payments CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS treatment_plans CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS visits CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS appointments CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS consultations CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS customers CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS projects CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS channels CASCADE`);
  await pool.query(`DROP TABLE IF EXISTS consultants CASCADE`);

  await pool.query(`
    CREATE TABLE consultants (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      team VARCHAR NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE channels (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE projects (
      id VARCHAR PRIMARY KEY,
      name VARCHAR NOT NULL,
      category VARCHAR NOT NULL,
      is_sensitive BOOLEAN NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE customers (
      id VARCHAR PRIMARY KEY,
      masked_phone VARCHAR NOT NULL,
      stage VARCHAR NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE consultations (
      id VARCHAR PRIMARY KEY,
      customer_id VARCHAR NOT NULL,
      consultant_id VARCHAR NOT NULL,
      channel_id VARCHAR NOT NULL,
      project_id VARCHAR NOT NULL,
      created_at VARCHAR NOT NULL,
      status VARCHAR NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (consultant_id) REFERENCES consultants(id),
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  await pool.query(`
    CREATE TABLE appointments (
      id VARCHAR PRIMARY KEY,
      consultation_id VARCHAR NOT NULL,
      scheduled_at VARCHAR NOT NULL,
      confirmed_at VARCHAR,
      status VARCHAR NOT NULL,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    )
  `);

  await pool.query(`
    CREATE TABLE visits (
      id VARCHAR PRIMARY KEY,
      appointment_id VARCHAR NOT NULL,
      arrived_at VARCHAR NOT NULL,
      status VARCHAR NOT NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    )
  `);

  await pool.query(`
    CREATE TABLE treatment_plans (
      id VARCHAR PRIMARY KEY,
      visit_id VARCHAR NOT NULL,
      project_id VARCHAR NOT NULL,
      category VARCHAR NOT NULL,
      is_sensitive BOOLEAN NOT NULL,
      estimated_amount NUMERIC NOT NULL,
      status VARCHAR NOT NULL,
      FOREIGN KEY (visit_id) REFERENCES visits(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  await pool.query(`
    CREATE TABLE payments (
      id VARCHAR PRIMARY KEY,
      plan_id VARCHAR NOT NULL,
      amount NUMERIC NOT NULL,
      method VARCHAR NOT NULL,
      paid_at VARCHAR NOT NULL,
      status VARCHAR NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES treatment_plans(id)
    )
  `);

  await pool.query(`
    CREATE TABLE follow_ups (
      id VARCHAR PRIMARY KEY,
      payment_id VARCHAR NOT NULL,
      project_id VARCHAR NOT NULL,
      next_visit_at VARCHAR,
      actual_visit_at VARCHAR,
      interval_days INTEGER,
      status VARCHAR NOT NULL,
      FOREIGN KEY (payment_id) REFERENCES payments(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  await pool.query(`CREATE INDEX idx_consultations_consultant_id ON consultations(consultant_id)`);
  await pool.query(`CREATE INDEX idx_consultations_channel_id ON consultations(channel_id)`);
  await pool.query(`CREATE INDEX idx_consultations_project_id ON consultations(project_id)`);
  await pool.query(`CREATE INDEX idx_consultations_created_at ON consultations(created_at)`);
  await pool.query(`CREATE INDEX idx_customers_stage ON customers(stage)`);
  await pool.query(`CREATE INDEX idx_follow_ups_project_id ON follow_ups(project_id)`);
  await pool.query(`CREATE INDEX idx_follow_ups_interval_days ON follow_ups(interval_days)`);
}

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

interface SeedCustomer {
  id: string;
  maskedPhone: string;
  stage: string;
}

interface SeedConsultation {
  id: string;
  customerId: string;
  consultantId: string;
  channelId: string;
  projectId: string;
  createdAt: string;
  status: string;
}

interface SeedAppointment {
  id: string;
  consultationId: string;
  scheduledAt: string;
  confirmedAt: string | null;
  status: string;
}

interface SeedVisit {
  id: string;
  appointmentId: string;
  arrivedAt: string;
  status: string;
}

interface SeedTreatmentPlan {
  id: string;
  visitId: string;
  projectId: string;
  category: string;
  isSensitive: boolean;
  estimatedAmount: number;
  status: string;
}

interface SeedPayment {
  id: string;
  planId: string;
  amount: number;
  method: string;
  paidAt: string;
  status: string;
}

interface SeedFollowUp {
  id: string;
  paymentId: string;
  projectId: string;
  nextVisitAt: string | null;
  actualVisitAt: string | null;
  intervalDays: number | null;
  status: string;
}

function generateCustomers(count: number): SeedCustomer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cust${i + 1}`,
    maskedPhone: `138****${String(seededInt(1000, 9999))}`,
    stage: seededPick(STAGES),
  }));
}

function generateConsultations(customers: SeedCustomer[]): SeedConsultation[] {
  const result: SeedConsultation[] = [];
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

function generateAppointments(consultations: SeedConsultation[]): SeedAppointment[] {
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

function generateVisits(appointments: SeedAppointment[]): SeedVisit[] {
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

function generateTreatmentPlans(visits: SeedVisit[]): SeedTreatmentPlan[] {
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

function generatePayments(plans: SeedTreatmentPlan[]): SeedPayment[] {
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

function generateFollowUps(payments: SeedPayment[]): SeedFollowUp[] {
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

function buildBatchInsert(table: string, columns: string[], rows: unknown[][]): { sql: string; values: unknown[] } {
  const colList = columns.join(', ');
  const placeholders: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  for (const row of rows) {
    const rowPlaceholders: string[] = [];
    for (const val of row) {
      rowPlaceholders.push(`$${paramIndex}`);
      values.push(val);
      paramIndex++;
    }
    placeholders.push(`(${rowPlaceholders.join(', ')})`);
  }

  const sql = `INSERT INTO ${table} (${colList}) VALUES ${placeholders.join(', ')}`;
  return { sql, values };
}

export async function seedData(): Promise<void> {
  resetSeed();

  const pool = getPool();
  const customers = generateCustomers(500);
  const consultations = generateConsultations(customers);
  const appointments = generateAppointments(consultations);
  const visits = generateVisits(appointments);
  const treatmentPlans = generateTreatmentPlans(visits);
  const payments = generatePayments(treatmentPlans);
  const followUps = generateFollowUps(payments);

  {
    const { sql, values } = buildBatchInsert('consultants', ['id', 'name', 'team'], CONSULTANTS.map(c => [c.id, c.name, c.team]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('channels', ['id', 'name', 'type'], CHANNELS.map(ch => [ch.id, ch.name, ch.type]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('projects', ['id', 'name', 'category', 'is_sensitive'], PROJECTS.map(p => [p.id, p.name, p.category, p.isSensitive]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('customers', ['id', 'masked_phone', 'stage'], customers.map(c => [c.id, c.maskedPhone, c.stage]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('consultations', ['id', 'customer_id', 'consultant_id', 'channel_id', 'project_id', 'created_at', 'status'], consultations.map(c => [c.id, c.customerId, c.consultantId, c.channelId, c.projectId, c.createdAt, c.status]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('appointments', ['id', 'consultation_id', 'scheduled_at', 'confirmed_at', 'status'], appointments.map(a => [a.id, a.consultationId, a.scheduledAt, a.confirmedAt, a.status]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('visits', ['id', 'appointment_id', 'arrived_at', 'status'], visits.map(v => [v.id, v.appointmentId, v.arrivedAt, v.status]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('treatment_plans', ['id', 'visit_id', 'project_id', 'category', 'is_sensitive', 'estimated_amount', 'status'], treatmentPlans.map(p => [p.id, p.visitId, p.projectId, p.category, p.isSensitive, p.estimatedAmount, p.status]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('payments', ['id', 'plan_id', 'amount', 'method', 'paid_at', 'status'], payments.map(p => [p.id, p.planId, p.amount, p.method, p.paidAt, p.status]));
    await pool.query(sql, values);
  }

  {
    const { sql, values } = buildBatchInsert('follow_ups', ['id', 'payment_id', 'project_id', 'next_visit_at', 'actual_visit_at', 'interval_days', 'status'], followUps.map(f => [f.id, f.paymentId, f.projectId, f.nextVisitAt, f.actualVisitAt, f.intervalDays, f.status]));
    await pool.query(sql, values);
  }
}

export interface CleanResult {
  duplicatesRemoved: number;
  anomaliesFound: number;
}

export async function cleanData(): Promise<CleanResult> {
  const pool = getPool();
  let duplicatesRemoved = 0;

  const dupResult = await pool.query<{
    customer_id: string;
    project_id: string;
    date_key: string;
    keep_id: string;
  }>(`
    SELECT customer_id, project_id, DATE(created_at) as date_key, MIN(id) as keep_id
    FROM consultations
    GROUP BY customer_id, project_id, DATE(created_at)
    HAVING COUNT(*) > 1
  `);

  for (const dup of dupResult.rows) {
    const removeResult = await pool.query(
      `DELETE FROM consultations WHERE customer_id = $1 AND project_id = $2 AND DATE(created_at) = $3 AND id != $4`,
      [dup.customer_id, dup.project_id, dup.date_key, dup.keep_id]
    );
    duplicatesRemoved += removeResult.rowCount ?? 0;
  }

  let anomaliesFound = 0;

  const orphanAppointments = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM appointments WHERE consultation_id NOT IN (SELECT id FROM consultations)`
  );
  anomaliesFound += Number(orphanAppointments.rows[0].cnt);

  const orphanVisits = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM visits WHERE appointment_id NOT IN (SELECT id FROM appointments)`
  );
  anomaliesFound += Number(orphanVisits.rows[0].cnt);

  const orphanPlans = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM treatment_plans WHERE visit_id NOT IN (SELECT id FROM visits)`
  );
  anomaliesFound += Number(orphanPlans.rows[0].cnt);

  const orphanPayments = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM payments WHERE plan_id NOT IN (SELECT id FROM treatment_plans)`
  );
  anomaliesFound += Number(orphanPayments.rows[0].cnt);

  const orphanFollowUps = await pool.query<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM follow_ups WHERE payment_id NOT IN (SELECT id FROM payments)`
  );
  anomaliesFound += Number(orphanFollowUps.rows[0].cnt);

  return { duplicatesRemoved, anomaliesFound };
}

export async function initializeDatabase(): Promise<void> {
  await initializeSchema();
  const pool = getPool();
  const result = await pool.query<{ count: string }>('SELECT COUNT(*) as count FROM consultants');
  if (Number(result.rows[0].count) === 0) {
    await seedData();
  }
}

export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
