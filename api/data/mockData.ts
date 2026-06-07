export interface RawConsultation {
  id: string;
  customerId: string;
  consultantId: string;
  channelId: string;
  projectId: string;
  createdAt: string;
  status: string;
}

export interface RawAppointment {
  id: string;
  consultationId: string;
  scheduledAt: string;
  confirmedAt: string | null;
  status: string;
}

export interface RawVisit {
  id: string;
  appointmentId: string;
  arrivedAt: string;
  status: string;
}

export interface RawTreatmentPlan {
  id: string;
  visitId: string;
  projectId: string;
  category: string;
  isSensitive: boolean;
  estimatedAmount: number;
  status: string;
}

export interface RawPayment {
  id: string;
  planId: string;
  amount: number;
  method: string;
  paidAt: string;
  status: string;
}

export interface RawFollowUp {
  id: string;
  paymentId: string;
  projectId: string;
  nextVisitAt: string | null;
  actualVisitAt: string | null;
  intervalDays: number | null;
  status: string;
}

export interface RawConsultant {
  id: string;
  name: string;
  team: string;
}

export interface RawChannel {
  id: string;
  name: string;
  type: string;
}

export interface RawProject {
  id: string;
  name: string;
  category: string;
  isSensitive: boolean;
}

export interface RawCustomer {
  id: string;
  maskedPhone: string;
  stage: string;
}

const CONSULTANTS: RawConsultant[] = [
  { id: 'c1', name: '张薇', team: 'A组' },
  { id: 'c2', name: '李明', team: 'A组' },
  { id: 'c3', name: '王芳', team: 'B组' },
  { id: 'c4', name: '赵强', team: 'B组' },
  { id: 'c5', name: '陈静', team: 'C组' },
  { id: 'c6', name: '刘洋', team: 'C组' },
  { id: 'c7', name: '黄丽', team: 'A组' },
  { id: 'c8', name: '周伟', team: 'B组' },
];

const CHANNELS: RawChannel[] = [
  { id: 'ch1', name: '小红书', type: 'social' },
  { id: 'ch2', name: '抖音', type: 'social' },
  { id: 'ch3', name: '美团', type: 'platform' },
  { id: 'ch4', name: '百度推广', type: 'search' },
  { id: 'ch5', name: '口碑转介', type: 'referral' },
  { id: 'ch6', name: '线下活动', type: 'offline' },
];

const PROJECTS: RawProject[] = [
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

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function randomDate(start: Date, end: Date): string {
  const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(time).toISOString();
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateCustomers(count: number): RawCustomer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cust${i + 1}`,
    maskedPhone: `138****${String(randomInt(1000, 9999))}`,
    stage: randomPick(STAGES),
  }));
}

function generateConsultations(
  customers: RawCustomer[],
  months: string[],
): RawConsultation[] {
  const result: RawConsultation[] = [];
  const start = new Date('2024-07-01');
  const end = new Date('2025-06-30');

  for (const customer of customers) {
    const numConsultations = randomInt(1, 3);
    for (let j = 0; j < numConsultations; j++) {
      result.push({
        id: `con${result.length + 1}`,
        customerId: customer.id,
        consultantId: randomPick(CONSULTANTS).id,
        channelId: randomPick(CHANNELS).id,
        projectId: randomPick(PROJECTS).id,
        createdAt: randomDate(start, end),
        status: randomPick(['active', 'active', 'active', 'closed']),
      });
    }
  }
  return result;
}

function generateAppointments(consultations: RawConsultation[]): RawAppointment[] {
  return consultations
    .filter(() => Math.random() < 0.72)
    .map((con, i) => {
      const scheduledAt = new Date(con.createdAt);
      scheduledAt.setDate(scheduledAt.getDate() + randomInt(1, 7));
      return {
        id: `apt${i + 1}`,
        consultationId: con.id,
        scheduledAt: scheduledAt.toISOString(),
        confirmedAt: Math.random() < 0.85 ? scheduledAt.toISOString() : null,
        status: randomPick(['confirmed', 'pending', 'cancelled']),
      };
    });
}

function generateVisits(appointments: RawAppointment[]): RawVisit[] {
  return appointments
    .filter((apt) => apt.confirmedAt && Math.random() < 0.68)
    .map((apt, i) => {
      const arrivedAt = new Date(apt.scheduledAt);
      arrivedAt.setMinutes(arrivedAt.getMinutes() + randomInt(-15, 30));
      return {
        id: `vis${i + 1}`,
        appointmentId: apt.id,
        arrivedAt: arrivedAt.toISOString(),
        status: 'completed',
      };
    });
}

function generateTreatmentPlans(visits: RawVisit[]): RawTreatmentPlan[] {
  return visits
    .filter(() => Math.random() < 0.6)
    .map((vis, i) => {
      const project = randomPick(PROJECTS);
      return {
        id: `plan${i + 1}`,
        visitId: vis.id,
        projectId: project.id,
        category: project.category,
        isSensitive: project.isSensitive,
        estimatedAmount: randomInt(2000, 80000) * 100 / 100,
        status: randomPick(['proposed', 'accepted', 'rejected']),
      };
    });
}

function generatePayments(plans: RawTreatmentPlan[]): RawPayment[] {
  return plans
    .filter((p) => p.status === 'accepted' || Math.random() < 0.55)
    .map((plan, i) => ({
      id: `pay${i + 1}`,
      planId: plan.id,
      amount: plan.estimatedAmount * randomInt(80, 100) / 100,
      method: randomPick(['微信', '支付宝', '银行卡', '分期']),
      paidAt: new Date().toISOString(),
      status: randomPick(['completed', 'completed', 'completed', 'pending']),
    }));
}

function generateFollowUps(payments: RawPayment[]): RawFollowUp[] {
  return payments
    .filter((p) => p.status === 'completed')
    .map((pay, i) => {
      const nextVisit = new Date(pay.paidAt);
      nextVisit.setDate(nextVisit.getDate() + randomInt(14, 90));
      const didVisit = Math.random() < 0.4;
      const actualVisit = didVisit ? new Date(nextVisit.getTime() + randomInt(-3, 7) * 86400000) : null;
      return {
        id: `fu${i + 1}`,
        paymentId: pay.id,
        projectId: randomPick(PROJECTS).id,
        nextVisitAt: nextVisit.toISOString(),
        actualVisitAt: actualVisit?.toISOString() ?? null,
        intervalDays: actualVisit
          ? Math.round((actualVisit.getTime() - new Date(pay.paidAt).getTime()) / 86400000)
          : null,
        status: didVisit ? 'completed' : randomPick(['scheduled', 'overdue']),
      };
    });
}

const MONTHS = [
  '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
  '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
];

export interface DataSet {
  customers: RawCustomer[];
  consultants: RawConsultant[];
  channels: RawChannel[];
  projects: RawProject[];
  consultations: RawConsultation[];
  appointments: RawAppointment[];
  visits: RawVisit[];
  treatmentPlans: RawTreatmentPlan[];
  payments: RawPayment[];
  followUps: RawFollowUp[];
  months: string[];
}

let _dataSet: DataSet | null = null;

export function getDataSet(): DataSet {
  if (_dataSet) return _dataSet;

  const customers = generateCustomers(500);
  const consultations = generateConsultations(customers, MONTHS);
  const appointments = generateAppointments(consultations);
  const visits = generateVisits(appointments);
  const treatmentPlans = generateTreatmentPlans(visits);
  const payments = generatePayments(treatmentPlans);
  const followUps = generateFollowUps(payments);

  _dataSet = {
    customers,
    consultants: CONSULTANTS,
    channels: CHANNELS,
    projects: PROJECTS,
    consultations,
    appointments,
    visits,
    treatmentPlans,
    payments,
    followUps,
    months: MONTHS,
  };

  return _dataSet;
}

export function maskSensitiveProjects<T extends { projectId: string; isSensitive?: boolean; category?: string }>(
  items: T[],
  projects: RawProject[],
): Array<T & { projectName: string }> {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  return items.map((item) => {
    const project = projectMap.get(item.projectId);
    const projectName = project
      ? project.isSensitive
        ? project.category
        : project.name
      : '未知项目';
    return { ...item, projectName };
  });
}

export function filterByParams<T extends { createdAt?: string; consultantId?: string; channelId?: string; projectId?: string; customerId?: string }>(
  items: T[],
  params: {
    projectIds?: string[];
    consultantIds?: string[];
    channelIds?: string[];
    months?: string[];
  },
  customers?: RawCustomer[],
  customerStage?: string,
): T[] {
  let result = items;

  if (params.projectIds?.length) {
    result = result.filter((item) => 'projectId' in item && params.projectIds!.includes((item as Record<string, unknown>).projectId as string));
  }
  if (params.consultantIds?.length) {
    result = result.filter((item) => 'consultantId' in item && params.consultantIds!.includes((item as Record<string, unknown>).consultantId as string));
  }
  if (params.channelIds?.length) {
    result = result.filter((item) => 'channelId' in item && params.channelIds!.includes((item as Record<string, unknown>).channelId as string));
  }
  if (params.months?.length && result.length > 0 && 'createdAt' in result[0]) {
    result = result.filter((item) => {
      const d = (item as Record<string, unknown>).createdAt as string | undefined;
      if (!d) return true;
      const month = d.substring(0, 7);
      return params.months!.includes(month);
    });
  }
  if (customerStage && customers) {
    const customerIds = new Set(
      customers.filter((c) => c.stage === customerStage).map((c) => c.id),
    );
    result = result.filter(
      (item) => 'customerId' in item && customerIds.has((item as Record<string, unknown>).customerId as string),
    );
  }

  return result;
}
